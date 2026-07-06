import { Router } from "express";
import { db } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getAuth } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

// Use the conversations/messages from the OpenAI integration template tables
// They're in lib/db/src/schema/conversations.ts and messages.ts
import { conversationsTable, messagesTable } from "@workspace/db";

const router = Router();

// List conversations
router.get("/openai/conversations", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const conversations = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.userId, userId))
      .orderBy(sql`${conversationsTable.createdAt} desc`);

    return res.json(conversations.map((c) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt,
    })));
  } catch (err) {
    logger.error({ err }, "Error listing conversations");
    return res.status(500).json({ error: "Failed to list conversations" });
  }
});

// Create conversation
router.post("/openai/conversations", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const [conv] = await db
      .insert(conversationsTable)
      .values({ userId, title })
      .returning();

    return res.status(201).json({ id: conv.id, title: conv.title, createdAt: conv.createdAt });
  } catch (err) {
    logger.error({ err }, "Error creating conversation");
    return res.status(500).json({ error: "Failed to create conversation" });
  }
});

// Get conversation with messages
router.get("/openai/conversations/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conv || conv.userId !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    return res.json({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      messages: messages.map((m) => ({
        id: m.id,
        conversationId: m.conversationId,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    });
  } catch (err) {
    logger.error({ err }, "Error fetching conversation");
    return res.status(500).json({ error: "Failed to fetch conversation" });
  }
});

// Update conversation title
router.patch("/openai/conversations/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });

    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conv || conv.userId !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const [updated] = await db
      .update(conversationsTable)
      .set({ title })
      .where(eq(conversationsTable.id, id))
      .returning();

    return res.json({ id: updated.id, title: updated.title, createdAt: updated.createdAt });
  } catch (err) {
    logger.error({ err }, "Error updating conversation");
    return res.status(500).json({ error: "Failed to update conversation" });
  }
});

// Delete conversation
router.delete("/openai/conversations/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conv || conv.userId !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
    return res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Error deleting conversation");
    return res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// List messages
router.get("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conv || conv.userId !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    const messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    return res.json(messages);
  } catch (err) {
    logger.error({ err }, "Error listing messages");
    return res.status(500).json({ error: "Failed to list messages" });
  }
});

// Send message (streaming)
router.post("/openai/conversations/:id/messages", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const id = parseInt(req.params.id);
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Content required" });

    const [conv] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, id));

    if (!conv || conv.userId !== userId) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Save user message
    await db.insert(messagesTable).values({
      conversationId: id,
      role: "user",
      content,
    });

    // Get conversation history
    const history = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, id))
      .orderBy(messagesTable.createdAt);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const systemPrompt = `You are a knowledgeable legal assistant helping a pro se litigant (a person representing themselves in court) understand their legal situation.

You provide:
- Clear, plain-English explanations of legal concepts
- General legal information (not legal advice)
- Procedural guidance
- Relevant case law references when helpful
- Warnings about important deadlines and procedural traps

Always remind users that you provide legal INFORMATION, not legal ADVICE, and they should verify all information with current local court rules before filing. Encourage them when appropriate.`;

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
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
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save assistant response
    await db.insert(messagesTable).values({
      conversationId: id,
      role: "assistant",
      content: fullResponse,
    });

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  } catch (err) {
    logger.error({ err }, "Error sending message");
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to send message" });
    }
    res.write(`data: ${JSON.stringify({ error: "Stream error" })}\n\n`);
    res.end();
    return;
  }
});

export default router;
