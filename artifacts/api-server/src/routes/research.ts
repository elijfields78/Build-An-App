import { Router } from "express";
import { db } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getAuth } from "@clerk/express";
import { eq, sql, count } from "drizzle-orm";
import { logger } from "../lib/logger";
import { checkUsage } from "../lib/tierGate";
import {
  researchSessionsTable,
  researchMessagesTable,
} from "@workspace/db";

const router = Router();

// List research sessions
router.get("/research", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const sessions = await db
      .select()
      .from(researchSessionsTable)
      .where(eq(researchSessionsTable.userId, userId))
      .orderBy(sql`${researchSessionsTable.updatedAt} desc`);

    const result = await Promise.all(
      sessions.map(async (s) => {
        const [msgCount] = await db
          .select({ count: count() })
          .from(researchMessagesTable)
          .where(eq(researchMessagesTable.sessionId, s.id));
        return {
          ...s,
          messageCount: Number(msgCount?.count ?? 0),
        };
      })
    );

    return res.json(result);
  } catch (err) {
    logger.error({ err }, "Error listing research sessions");
    return res.status(500).json({ error: "Failed to list sessions" });
  }
});

// Create research session
router.post("/research", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, caseId } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const [session] = await db
      .insert(researchSessionsTable)
      .values({ userId, title, caseId: caseId ?? null })
      .returning();

    return res.status(201).json({ ...session, messageCount: 0 });
  } catch (err) {
    logger.error({ err }, "Error creating research session");
    return res.status(500).json({ error: "Failed to create session" });
  }
});

// Get research session with messages
router.get("/research/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const [session] = await db
      .select()
      .from(researchSessionsTable)
      .where(eq(researchSessionsTable.id, id));

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: "Session not found" });
    }

    const messages = await db
      .select()
      .from(researchMessagesTable)
      .where(eq(researchMessagesTable.sessionId, id))
      .orderBy(researchMessagesTable.createdAt);

    return res.json({ ...session, messages });
  } catch (err) {
    logger.error({ err }, "Error fetching research session");
    return res.status(500).json({ error: "Failed to fetch session" });
  }
});

// Delete research session
router.delete("/research/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const [session] = await db
      .select()
      .from(researchSessionsTable)
      .where(eq(researchSessionsTable.id, id));

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: "Session not found" });
    }

    await db.delete(researchSessionsTable).where(eq(researchSessionsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Error deleting research session");
    return res.status(500).json({ error: "Failed to delete session" });
  }
});

// Ask a research question (streaming) — gated by monthly usage limit for free tier
router.post("/research/:id/ask", checkUsage("research_ask"), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id as string);
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question required" });

    const [session] = await db
      .select()
      .from(researchSessionsTable)
      .where(eq(researchSessionsTable.id, id));

    if (!session || session.userId !== userId) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Save user question
    await db.insert(researchMessagesTable).values({
      sessionId: id,
      role: "user",
      content: question,
    });

    // Get conversation history
    const history = await db
      .select()
      .from(researchMessagesTable)
      .where(eq(researchMessagesTable.sessionId, id))
      .orderBy(researchMessagesTable.createdAt);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const systemPrompt = `You are an expert legal research assistant helping a pro se litigant (someone representing themselves in court). You have deep knowledge of federal and state civil procedure, constitutional law, torts, contracts, civil rights statutes (42 U.S.C. § 1983, Title VII, ADA, etc.), and case law.

When answering:
1. Provide well-reasoned, thorough legal analysis
2. Cite specific statutes, regulations, and case law when relevant (e.g., "Under Fed. R. Civ. P. 12(b)(6)..." or "In Ashcroft v. Iqbal, 556 U.S. 662 (2009)...")
3. Explain concepts in plain English that a non-lawyer can understand
4. Identify potential procedural pitfalls and deadlines
5. Note when law varies by jurisdiction and advise verification
6. Always end with: "IMPORTANT: Verify this information against your local court rules and current statutes before filing. This is legal information, not legal advice."

Be thorough, cite sources, and help the user build a strong, factually grounded legal position.`;

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullResponse += text;
        res.write(text);
      }
    }

    // Save assistant response
    await db.insert(researchMessagesTable).values({
      sessionId: id,
      role: "assistant",
      content: fullResponse,
    });

    // Update session timestamp
    await db
      .update(researchSessionsTable)
      .set({ updatedAt: new Date() })
      .where(eq(researchSessionsTable.id, id));

    res.end();
    return;
  } catch (err) {
    logger.error({ err }, "Error in research ask");
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to process question" });
    }
    res.end();
    return;
  }
});

export default router;
