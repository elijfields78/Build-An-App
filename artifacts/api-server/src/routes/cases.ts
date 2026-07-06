import { Router } from "express";
import { db } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { getAuth } from "@clerk/express";
import { eq, and, count } from "drizzle-orm";
import { logger } from "../lib/logger";
import path from "path";
import fs from "fs";
import multer from "multer";
import {
  casesTable,
  caseStoriesTable,
  evidenceTable,
  courtDocumentsTable,
  jurisdictionAnalysisTable,
  ifpApplicationsTable,
  complaintsTable,
  caseTasksTable,
} from "@workspace/db";

const router = Router();

// Uploads dir
const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();
const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}-${file.originalname}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// Helper: get case and verify ownership
async function getOwnedCase(userId: string, caseId: number) {
  const [c] = await db.select().from(casesTable).where(eq(casesTable.id, caseId));
  if (!c || c.userId !== userId) return null;
  return c;
}

// Helper: get case counts
async function getCaseCounts(caseId: number) {
  const [evCount] = await db.select({ count: count() }).from(evidenceTable).where(eq(evidenceTable.caseId, caseId));
  const [taskCount] = await db.select({ count: count() }).from(caseTasksTable).where(eq(caseTasksTable.caseId, caseId));
  const [completedCount] = await db
    .select({ count: count() })
    .from(caseTasksTable)
    .where(and(eq(caseTasksTable.caseId, caseId), eq(caseTasksTable.completed, true)));
  return {
    evidenceCount: Number(evCount?.count ?? 0),
    taskCount: Number(taskCount?.count ?? 0),
    completedTaskCount: Number(completedCount?.count ?? 0),
  };
}

// Helper: seed default tasks for a new case
async function seedDefaultTasks(caseId: number, caseType: string) {
  const plaintiffTasks = [
    { phase: "pre-filing", title: "Complete Case Story Builder", description: "Document all facts: who, what, when, where, damages", sortOrder: 1 },
    { phase: "pre-filing", title: "Upload all evidence", description: "Organize contracts, emails, photos, receipts, and other proof", sortOrder: 2 },
    { phase: "pre-filing", title: "Complete Jurisdiction Analysis", description: "Determine proper court, jurisdiction, and venue", sortOrder: 3 },
    { phase: "pre-filing", title: "Research applicable statutes and case law", description: "Identify legal basis for your claims", sortOrder: 4 },
    { phase: "pre-filing", title: "Check statute of limitations", description: "Confirm your claims are timely", sortOrder: 5 },
    { phase: "pre-filing", title: "Draft Verified Complaint", description: "Generate your complaint using the Complaint Builder", sortOrder: 6 },
    { phase: "filing", title: "Prepare Civil Cover Sheet (JS 44)", description: "Required for federal cases", sortOrder: 7 },
    { phase: "filing", title: "Prepare Summons (AO 440)", description: "One summons per defendant", sortOrder: 8 },
    { phase: "filing", title: "Determine filing fee or prepare IFP application", description: "AO 239 (long) or AO 240 (short) if unable to pay fees", sortOrder: 9 },
    { phase: "filing", title: "File complaint with the court clerk", description: "Bring originals + copies. Confirm local rules for filing requirements", sortOrder: 10 },
    { phase: "service", title: "Serve defendant with summons and complaint", description: "Follow Fed. R. Civ. P. 4 for federal cases or state rules", sortOrder: 11 },
    { phase: "service", title: "File proof of service", description: "Affidavit or return of service filed with the court", sortOrder: 12 },
    { phase: "response", title: "Monitor defendant response deadline", description: "Usually 21 days for federal cases after service", sortOrder: 13 },
    { phase: "response", title: "If no response, research default judgment", description: "Motion for default under Fed. R. Civ. P. 55", sortOrder: 14 },
    { phase: "discovery", title: "Send initial disclosures", description: "Required under Fed. R. Civ. P. 26(a)(1) within 14 days of scheduling conference", sortOrder: 15 },
    { phase: "discovery", title: "Prepare interrogatories", description: "Written questions to opposing party (max 25 under federal rules)", sortOrder: 16 },
    { phase: "discovery", title: "Prepare requests for production", description: "Request documents, emails, records from opposing party", sortOrder: 17 },
    { phase: "motions", title: "Respond to any motions to dismiss", description: "You typically have 21 days to oppose", sortOrder: 18 },
    { phase: "trial", title: "Prepare trial exhibits and witness list", description: "Follow local rules for exhibit numbering", sortOrder: 19 },
    { phase: "appeal", title: "Note appeal deadline if judgment is adverse", description: "Usually 30 days for federal civil cases (Fed. R. App. P. 4)", sortOrder: 20 },
  ];

  const defendantTasks = [
    { phase: "pre-filing", title: "Read the complaint carefully", description: "Identify all claims, parties, and relief requested", sortOrder: 1 },
    { phase: "pre-filing", title: "Note your response deadline", description: "Usually 21 days after service for federal cases", sortOrder: 2 },
    { phase: "pre-filing", title: "Upload all case documents received", description: "Summons, complaint, and any other papers", sortOrder: 3 },
    { phase: "pre-filing", title: "Research the claims against you", description: "Understand what plaintiff must prove for each claim", sortOrder: 4 },
    { phase: "pre-filing", title: "Identify affirmative defenses", description: "Statute of limitations, lack of jurisdiction, failure to state a claim, etc.", sortOrder: 5 },
    { phase: "filing", title: "Draft and file Answer or Motion to Dismiss", description: "Answer admits/denies each allegation. Motion to Dismiss challenges legal sufficiency", sortOrder: 6 },
    { phase: "response", title: "Assert counterclaims if applicable", description: "Claims you have against the plaintiff", sortOrder: 7 },
    { phase: "discovery", title: "Respond to plaintiff's discovery requests", description: "Typically 30 days to respond to interrogatories and RFPs", sortOrder: 8 },
    { phase: "discovery", title: "Send your own discovery requests", description: "Gather evidence to support your defense", sortOrder: 9 },
    { phase: "motions", title: "Consider motion for summary judgment", description: "If no genuine dispute of material fact exists", sortOrder: 10 },
    { phase: "trial", title: "Prepare defense exhibits and witness list", description: "Follow local rules for exhibit numbering", sortOrder: 11 },
    { phase: "appeal", title: "Note appeal deadline if judgment is adverse", description: "Usually 30 days for federal civil cases", sortOrder: 12 },
  ];

  const tasks = caseType === "defendant" ? defendantTasks : plaintiffTasks;
  await db.insert(caseTasksTable).values(tasks.map((t) => ({ ...t, caseId })));
}

// ── Cases CRUD ────────────────────────────────────────────────────────────────

router.get("/cases", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const cases = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.userId, userId))
      .orderBy(casesTable.updatedAt);

    const result = await Promise.all(
      cases.reverse().map(async (c) => ({ ...c, ...(await getCaseCounts(c.id)) }))
    );

    return res.json(result);
  } catch (err) {
    logger.error({ err }, "Error listing cases");
    return res.status(500).json({ error: "Failed to list cases" });
  }
});

router.post("/cases", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { title, caseType, court, opposingParty, summary } = req.body;
    if (!title || !caseType) return res.status(400).json({ error: "title and caseType required" });

    const [newCase] = await db
      .insert(casesTable)
      .values({ userId, title, caseType, court, opposingParty, summary })
      .returning();

    // Seed default tasks
    await seedDefaultTasks(newCase.id, caseType);

    const counts = await getCaseCounts(newCase.id);
    return res.status(201).json({ ...newCase, ...counts });
  } catch (err) {
    logger.error({ err }, "Error creating case");
    return res.status(500).json({ error: "Failed to create case" });
  }
});

router.get("/cases/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [story] = await db.select().from(caseStoriesTable).where(eq(caseStoriesTable.caseId, caseId));
    const recentEvidence = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.caseId, caseId))
      .orderBy(evidenceTable.uploadedAt)
      .limit(5);
    const tasks = await db
      .select()
      .from(caseTasksTable)
      .where(eq(caseTasksTable.caseId, caseId))
      .orderBy(caseTasksTable.sortOrder);
    const counts = await getCaseCounts(caseId);

    return res.json({
      ...c,
      ...counts,
      story: story ?? null,
      recentEvidence: recentEvidence.reverse(),
      tasks,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching case");
    return res.status(500).json({ error: "Failed to fetch case" });
  }
});

router.patch("/cases/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const { title, caseType, status, court, caseNumber, opposingParty, summary } = req.body;
    const [updated] = await db
      .update(casesTable)
      .set({ title, caseType, status, court, caseNumber, opposingParty, summary, updatedAt: new Date() })
      .where(eq(casesTable.id, caseId))
      .returning();

    const counts = await getCaseCounts(caseId);
    return res.json({ ...updated, ...counts });
  } catch (err) {
    logger.error({ err }, "Error updating case");
    return res.status(500).json({ error: "Failed to update case" });
  }
});

router.delete("/cases/:id", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    await db.delete(casesTable).where(eq(casesTable.id, caseId));
    return res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Error deleting case");
    return res.status(500).json({ error: "Failed to delete case" });
  }
});

// ── Case Story ────────────────────────────────────────────────────────────────

router.get("/cases/:id/story", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [story] = await db.select().from(caseStoriesTable).where(eq(caseStoriesTable.caseId, caseId));
    if (!story) return res.status(404).json({ error: "Story not found" });
    return res.json(story);
  } catch (err) {
    logger.error({ err }, "Error fetching story");
    return res.status(500).json({ error: "Failed to fetch story" });
  }
});

router.put("/cases/:id/story", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const fields = req.body;
    const [existing] = await db.select().from(caseStoriesTable).where(eq(caseStoriesTable.caseId, caseId));

    let story;
    if (existing) {
      const [updated] = await db
        .update(caseStoriesTable)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(caseStoriesTable.caseId, caseId))
        .returning();
      story = updated;
    } else {
      const [created] = await db
        .insert(caseStoriesTable)
        .values({ caseId, ...fields })
        .returning();
      story = created;
    }

    // Generate AI summary
    try {
      const storyText = `
Who harmed you: ${fields.whoHarmedYou || ""}
What happened: ${fields.whatHappened || ""}
When: ${fields.whenHappened || ""}
Where: ${fields.whereHappened || ""}
Evidence: ${fields.evidenceDescription || ""}
Rights violated: ${fields.rightsViolated || ""}
Damages: ${fields.damagesSuffered || ""}
Desired outcome: ${fields.desiredOutcome || ""}
Remedy sought: ${fields.remedySought || ""}
Additional context: ${fields.additionalContext || ""}
      `.trim();

      if (storyText.length > 50) {
        const completion = await openai.chat.completions.create({
          model: "gpt-5.4",
          max_completion_tokens: 512,
          messages: [
            {
              role: "system",
              content: "You are a legal assistant. Summarize the pro se litigant's case story in 3-4 concise, factual sentences suitable for a legal case summary. Focus on the core claim, parties, and relief sought.",
            },
            { role: "user", content: storyText },
          ],
        });
        const aiSummary = completion.choices[0]?.message?.content || null;
        const [withSummary] = await db
          .update(caseStoriesTable)
          .set({ aiSummary })
          .where(eq(caseStoriesTable.caseId, caseId))
          .returning();
        story = withSummary;
      }
    } catch (aiErr) {
      logger.error({ aiErr }, "AI summary failed, continuing without it");
    }

    // Mark story complete on case
    const isComplete = !!(fields.whatHappened && fields.whoHarmedYou && fields.damagesSuffered);
    await db.update(casesTable).set({ storyComplete: isComplete, updatedAt: new Date() }).where(eq(casesTable.id, caseId));

    return res.json(story);
  } catch (err) {
    logger.error({ err }, "Error saving story");
    return res.status(500).json({ error: "Failed to save story" });
  }
});

// ── Evidence ──────────────────────────────────────────────────────────────────

router.get("/cases/:id/evidence", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const evidence = await db
      .select()
      .from(evidenceTable)
      .where(eq(evidenceTable.caseId, caseId))
      .orderBy(evidenceTable.uploadedAt);

    return res.json(evidence.reverse());
  } catch (err) {
    logger.error({ err }, "Error listing evidence");
    return res.status(500).json({ error: "Failed to list evidence" });
  }
});

router.post("/cases/:id/evidence", upload.single("file"), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id as string);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { description } = req.body;
    const [ev] = await db
      .insert(evidenceTable)
      .values({
        caseId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        filePath: req.file.path,
        description: description || null,
      })
      .returning();

    // Async AI analysis (non-blocking)
    openai.chat.completions
      .create({
        model: "gpt-5.4",
        max_completion_tokens: 1024,
        messages: [
          {
            role: "system",
            content: `You are a legal document analyst. The user has uploaded a file named "${req.file.originalname}" (${req.file.mimetype}) as evidence in a civil case.
${description ? `User's description: "${description}"` : ""}

Based on the file name and description, provide:
1. A brief AI summary of what this evidence likely contains/proves
2. Key dates that may appear (if inferable)
3. Key names or parties that may appear (if inferable)
4. 2-3 key facts this evidence may support

Respond in JSON: { "aiSummary": "...", "extractedDates": "...", "extractedNames": "...", "keyFacts": "..." }`,
          },
          { role: "user", content: `Evidence file: ${req.file.originalname}\nDescription: ${description || "none"}` },
        ],
      })
      .then(async (completion) => {
        try {
          const text = completion.choices[0]?.message?.content || "{}";
          const parsed = JSON.parse(text);
          await db
            .update(evidenceTable)
            .set({
              aiSummary: parsed.aiSummary || null,
              extractedDates: parsed.extractedDates || null,
              extractedNames: parsed.extractedNames || null,
              keyFacts: parsed.keyFacts || null,
            })
            .where(eq(evidenceTable.id, ev.id));
        } catch {
          // ignore
        }
      })
      .catch((err) => logger.error({ err }, "Evidence AI analysis failed"));

    return res.status(201).json(ev);
  } catch (err) {
    logger.error({ err }, "Error uploading evidence");
    return res.status(500).json({ error: "Failed to upload evidence" });
  }
});

router.get("/cases/:id/evidence/:eid", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const eid = parseInt(req.params.eid);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [ev] = await db
      .select()
      .from(evidenceTable)
      .where(and(eq(evidenceTable.id, eid), eq(evidenceTable.caseId, caseId)));
    if (!ev) return res.status(404).json({ error: "Evidence not found" });
    return res.json(ev);
  } catch (err) {
    logger.error({ err }, "Error fetching evidence");
    return res.status(500).json({ error: "Failed to fetch evidence" });
  }
});

router.delete("/cases/:id/evidence/:eid", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const eid = parseInt(req.params.eid);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    await db.delete(evidenceTable).where(and(eq(evidenceTable.id, eid), eq(evidenceTable.caseId, caseId)));
    return res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Error deleting evidence");
    return res.status(500).json({ error: "Failed to delete evidence" });
  }
});

// ── Court Documents ───────────────────────────────────────────────────────────

router.get("/cases/:id/court-documents", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const docs = await db
      .select()
      .from(courtDocumentsTable)
      .where(eq(courtDocumentsTable.caseId, caseId))
      .orderBy(courtDocumentsTable.uploadedAt);

    return res.json(docs.reverse());
  } catch (err) {
    logger.error({ err }, "Error listing court documents");
    return res.status(500).json({ error: "Failed to list documents" });
  }
});

router.post("/cases/:id/court-documents", upload.single("file"), async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id as string);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const [doc] = await db
      .insert(courtDocumentsTable)
      .values({
        caseId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        filePath: req.file.path,
      })
      .returning();

    // AI analysis (async, non-blocking - will update when done)
    openai.chat.completions
      .create({
        model: "gpt-5.4",
        max_completion_tokens: 2048,
        messages: [
          {
            role: "system",
            content: `You are a legal assistant helping a pro se litigant understand a court document they received. The file is named "${req.file.originalname}".

Analyze this document and provide:
1. Document type (e.g., "Summons", "Motion to Dismiss", "Order", "Complaint", "Discovery Request", "Notice", etc.)
2. Plain English summary (2-3 sentences a non-lawyer can understand)
3. Deadlines identified (any response deadlines mentioned)
4. What it means for the user's case
5. What they must do next (concrete action steps)
6. Procedural warnings (traps, risks, things NOT to do)
7. Brief draft response template if a response is required

Respond as JSON: {
  "documentType": "...",
  "plainEnglishSummary": "...",
  "deadlinesIdentified": "...",
  "whatItMeans": "...",
  "whatToDoNext": "...",
  "proceduralWarnings": "...",
  "draftResponse": "..."
}`,
          },
          { role: "user", content: `File name: ${req.file.originalname}\nFile type: ${req.file.mimetype}` },
        ],
      })
      .then(async (completion) => {
        try {
          const text = completion.choices[0]?.message?.content || "{}";
          const parsed = JSON.parse(text);
          await db
            .update(courtDocumentsTable)
            .set({
              documentType: parsed.documentType || null,
              plainEnglishSummary: parsed.plainEnglishSummary || null,
              deadlinesIdentified: parsed.deadlinesIdentified || null,
              whatItMeans: parsed.whatItMeans || null,
              whatToDoNext: parsed.whatToDoNext || null,
              proceduralWarnings: parsed.proceduralWarnings || null,
              draftResponse: parsed.draftResponse || null,
            })
            .where(eq(courtDocumentsTable.id, doc.id));
        } catch {
          // ignore
        }
      })
      .catch((err) => logger.error({ err }, "Court doc AI analysis failed"));

    return res.status(201).json(doc);
  } catch (err) {
    logger.error({ err }, "Error uploading court document");
    return res.status(500).json({ error: "Failed to upload document" });
  }
});

router.get("/cases/:id/court-documents/:did", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const did = parseInt(req.params.did);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [doc] = await db
      .select()
      .from(courtDocumentsTable)
      .where(and(eq(courtDocumentsTable.id, did), eq(courtDocumentsTable.caseId, caseId)));
    if (!doc) return res.status(404).json({ error: "Document not found" });
    return res.json(doc);
  } catch (err) {
    logger.error({ err }, "Error fetching court document");
    return res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.delete("/cases/:id/court-documents/:did", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const did = parseInt(req.params.did);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    await db.delete(courtDocumentsTable).where(and(eq(courtDocumentsTable.id, did), eq(courtDocumentsTable.caseId, caseId)));
    return res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Error deleting court document");
    return res.status(500).json({ error: "Failed to delete document" });
  }
});

// ── Jurisdiction Analysis ─────────────────────────────────────────────────────

router.get("/cases/:id/jurisdiction", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [analysis] = await db.select().from(jurisdictionAnalysisTable).where(eq(jurisdictionAnalysisTable.caseId, caseId));
    if (!analysis) return res.status(404).json({ error: "Jurisdiction analysis not found" });
    return res.json(analysis);
  } catch (err) {
    logger.error({ err }, "Error fetching jurisdiction");
    return res.status(500).json({ error: "Failed to fetch jurisdiction" });
  }
});

router.get("/cases/:id/jurisdiction/suggestions", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [story] = await db.select().from(caseStoriesTable).where(eq(caseStoriesTable.caseId, caseId));
    if (!story || (!story.whatHappened && !story.whoHarmedYou)) {
      return res.json({ storyFound: false });
    }

    const storyContext = [
      `Case type: ${c.caseType === "plaintiff" ? "Plaintiff (filing a lawsuit)" : "Defendant (defending a lawsuit)"}`,
      story.whoHarmedYou && `Who harmed you / opposing party: ${story.whoHarmedYou}`,
      story.whatHappened && `What happened: ${story.whatHappened}`,
      story.whenHappened && `When it happened: ${story.whenHappened}`,
      story.whereHappened && `Where it happened: ${story.whereHappened}`,
      story.rightsViolated && `Rights or laws violated: ${story.rightsViolated}`,
      story.damagesSuffered && `Damages suffered: ${story.damagesSuffered}`,
      story.remedySought && `Relief/remedy sought: ${story.remedySought}`,
      story.additionalContext && `Additional context: ${story.additionalContext}`,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 1024,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced civil litigation attorney advising a pro se litigant. Based on their case story, generate specific, actionable jurisdiction suggestions for each field in their legal complaint. Be specific — cite statutes, rules, and legal standards where applicable. Return only valid JSON, no markdown fences.",
        },
        {
          role: "user",
          content: `Case story:\n${storyContext}\n\nGenerate jurisdiction suggestions as JSON with exactly this shape:\n{\n  "storyFound": true,\n  "federalOrState": {\n    "recommendation": "federal" or "state" or "unsure",\n    "reason": "1-2 sentence explanation citing specific basis like 28 U.S.C. § 1331 or 28 U.S.C. § 1332"\n  },\n  "subjectMatterBasis": [\n    "Specific suggestion 1 (e.g., Federal Question - 42 U.S.C. § 1983: Civil rights violation under color of state law)",\n    "Specific suggestion 2",\n    "Specific suggestion 3 if applicable"\n  ],\n  "venue": [\n    "Specific venue basis 1 (e.g., The district where the events occurred)",\n    "Specific venue basis 2 if applicable"\n  ],\n  "statuteOfLimitations": [\n    "Specific limitation period with start date (e.g., 2 years from date of civil rights violation under § 1983)"\n  ]\n}`,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    try {
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    } catch {
      logger.error({ text }, "Failed to parse jurisdiction suggestions JSON");
      return res.json({ storyFound: false });
    }
  } catch (err) {
    logger.error({ err }, "Error generating jurisdiction suggestions");
    return res.status(500).json({ error: "Failed to generate suggestions" });
  }
});

router.put("/cases/:id/jurisdiction", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const fields = req.body;
    const [existing] = await db.select().from(jurisdictionAnalysisTable).where(eq(jurisdictionAnalysisTable.caseId, caseId));

    let analysis;
    if (existing) {
      const [updated] = await db
        .update(jurisdictionAnalysisTable)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(jurisdictionAnalysisTable.caseId, caseId))
        .returning();
      analysis = updated;
    } else {
      const [created] = await db
        .insert(jurisdictionAnalysisTable)
        .values({ caseId, ...fields })
        .returning();
      analysis = created;
    }

    // Generate AI analysis
    try {
      const answers = JSON.stringify(fields, null, 2);
      const completion = await openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 1024,
        messages: [
          {
            role: "system",
            content: `You are a federal civil procedure expert. Analyze these jurisdiction questionnaire answers and provide a concise legal analysis of: (1) proper court (federal vs state), (2) jurisdictional basis, (3) venue recommendation, (4) any jurisdictional risks or concerns, (5) statute of limitations assessment. Be specific and cite relevant rules (e.g., 28 U.S.C. § 1331, 28 U.S.C. § 1332, Fed. R. Civ. P. 12(b)(1-7)). Keep it under 400 words.`,
          },
          { role: "user", content: `Jurisdiction questionnaire answers:\n${answers}` },
        ],
      });
      const aiAnalysis = completion.choices[0]?.message?.content || null;
      const [withAnalysis] = await db
        .update(jurisdictionAnalysisTable)
        .set({ aiAnalysis })
        .where(eq(jurisdictionAnalysisTable.caseId, caseId))
        .returning();
      analysis = withAnalysis;
    } catch (aiErr) {
      logger.error({ aiErr }, "Jurisdiction AI analysis failed");
    }

    // Mark jurisdiction complete on case
    const isComplete = !!(fields.federalOrState && fields.subjectMatterJurisdiction);
    await db.update(casesTable).set({ jurisdictionComplete: isComplete, updatedAt: new Date() }).where(eq(casesTable.id, caseId));

    return res.json(analysis);
  } catch (err) {
    logger.error({ err }, "Error saving jurisdiction");
    return res.status(500).json({ error: "Failed to save jurisdiction" });
  }
});

// ── IFP Application ───────────────────────────────────────────────────────────

router.get("/cases/:id/ifp", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [ifp] = await db.select().from(ifpApplicationsTable).where(eq(ifpApplicationsTable.caseId, caseId));
    if (!ifp) return res.status(404).json({ error: "IFP application not found" });
    return res.json(ifp);
  } catch (err) {
    logger.error({ err }, "Error fetching IFP");
    return res.status(500).json({ error: "Failed to fetch IFP" });
  }
});

router.put("/cases/:id/ifp", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const fields = req.body;
    const [existing] = await db.select().from(ifpApplicationsTable).where(eq(ifpApplicationsTable.caseId, caseId));

    let ifp;
    if (existing) {
      const [updated] = await db
        .update(ifpApplicationsTable)
        .set({ ...fields, updatedAt: new Date() })
        .where(eq(ifpApplicationsTable.caseId, caseId))
        .returning();
      ifp = updated;
    } else {
      const [created] = await db
        .insert(ifpApplicationsTable)
        .values({ caseId, ...fields })
        .returning();
      ifp = created;
    }

    // Mark IFP complete
    const isComplete = !!(fields.formType && fields.monthlyIncome !== undefined);
    await db.update(casesTable).set({ ifpComplete: isComplete, updatedAt: new Date() }).where(eq(casesTable.id, caseId));

    return res.json(ifp);
  } catch (err) {
    logger.error({ err }, "Error saving IFP");
    return res.status(500).json({ error: "Failed to save IFP" });
  }
});

// ── Complaint ─────────────────────────────────────────────────────────────────

router.get("/cases/:id/complaint", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const [complaint] = await db.select().from(complaintsTable).where(eq(complaintsTable.caseId, caseId));
    if (!complaint) return res.status(404).json({ error: "Complaint not found" });
    return res.json(complaint);
  } catch (err) {
    logger.error({ err }, "Error fetching complaint");
    return res.status(500).json({ error: "Failed to fetch complaint" });
  }
});

router.post("/cases/:id/complaint/generate", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    // Gather all case data
    const [story] = await db.select().from(caseStoriesTable).where(eq(caseStoriesTable.caseId, caseId));
    const [jurisdiction] = await db.select().from(jurisdictionAnalysisTable).where(eq(jurisdictionAnalysisTable.caseId, caseId));

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const prompt = `Generate a professional verified civil complaint for a pro se plaintiff. Use this case information:

PLAINTIFF INFORMATION:
- Case title: ${c.title}
- Court: ${c.court || "Federal District Court"}
- Opposing party/defendant: ${c.opposingParty || "Unknown"}
- Case type: ${c.caseType}

CASE STORY:
${story ? `
- Who harmed you: ${story.whoHarmedYou || ""}
- What happened: ${story.whatHappened || ""}
- When: ${story.whenHappened || ""}
- Where: ${story.whereHappened || ""}
- Evidence: ${story.evidenceDescription || ""}
- Rights violated: ${story.rightsViolated || ""}
- Damages: ${story.damagesSuffered || ""}
- Desired outcome: ${story.desiredOutcome || ""}
- Remedy: ${story.remedySought || ""}
` : "No story data provided."}

JURISDICTION:
${jurisdiction ? `
- Court type: ${jurisdiction.federalOrState || ""}
- Subject matter: ${jurisdiction.subjectMatterJurisdiction || ""}
- Venue: ${jurisdiction.venue || ""}
` : "No jurisdiction data provided."}

Generate a properly structured Verified Complaint with:
1. Caption (UNITED STATES DISTRICT COURT / [COURT NAME])
2. Parties section (Plaintiff and Defendant)
3. Jurisdiction and Venue
4. Factual Background (numbered paragraphs)
5. Causes of Action (each as a separate count)
6. Prayer for Relief
7. Jury Demand (if money damages)
8. Verification statement
9. Certificate of Service

Write in proper legal format. Use numbered paragraphs. Be factual, professional, and precise. Add [PLAINTIFF NAME], [CASE NO.], [DATE] placeholders where needed. Include a disclaimer at the top: "DRAFT - FOR REVIEW ONLY - Pro Se Litigation Navigator Generated Document".`;

    let fullText = "";
    const stream = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: "You are an expert civil litigator drafting verified complaints for pro se litigants. Write formally, precisely, and in proper legal pleading format." },
        { role: "user", content: prompt },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content;
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    }

    // Save complaint
    const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.caseId, caseId));
    if (existing) {
      await db.update(complaintsTable).set({ complaintText: fullText, status: "draft", generatedAt: new Date(), updatedAt: new Date() }).where(eq(complaintsTable.caseId, caseId));
    } else {
      await db.insert(complaintsTable).values({ caseId, complaintText: fullText, status: "draft", juryDemand: true, generatedAt: new Date() });
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
    return;
  } catch (err) {
    logger.error({ err }, "Error generating complaint");
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate complaint" });
    }
    res.write(`data: ${JSON.stringify({ error: "Generation failed" })}\n\n`);
    res.end();
    return;
  }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────

router.get("/cases/:id/tasks", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const tasks = await db
      .select()
      .from(caseTasksTable)
      .where(eq(caseTasksTable.caseId, caseId))
      .orderBy(caseTasksTable.sortOrder);
    return res.json(tasks);
  } catch (err) {
    logger.error({ err }, "Error listing tasks");
    return res.status(500).json({ error: "Failed to list tasks" });
  }
});

router.patch("/cases/:id/tasks/:tid", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const caseId = parseInt(req.params.id);
    const tid = parseInt(req.params.tid);
    const c = await getOwnedCase(userId, caseId);
    if (!c) return res.status(404).json({ error: "Case not found" });

    const { completed, dueDate, title, description } = req.body;
    const [updated] = await db
      .update(caseTasksTable)
      .set({
        ...(completed !== undefined && { completed }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
      })
      .where(and(eq(caseTasksTable.id, tid), eq(caseTasksTable.caseId, caseId)))
      .returning();

    if (!updated) return res.status(404).json({ error: "Task not found" });
    return res.json(updated);
  } catch (err) {
    logger.error({ err }, "Error updating task");
    return res.status(500).json({ error: "Failed to update task" });
  }
});

export default router;
