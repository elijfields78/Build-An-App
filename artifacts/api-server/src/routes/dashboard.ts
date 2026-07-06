import { Router } from "express";
import { db } from "@workspace/db";
import {
  casesTable,
  evidenceTable,
  caseTasksTable,
} from "@workspace/db";
import { getAuth } from "@clerk/express";
import { eq, and, count, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const router = Router();

router.get("/dashboard", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const cases = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.userId, userId))
      .orderBy(sql`${casesTable.updatedAt} desc`)
      .limit(50);

    const totalCases = cases.length;
    const activeCases = cases.filter((c) => c.status === "active" || c.status === "intake").length;
    const recentCases = cases.slice(0, 5);

    const caseIds = cases.map((c) => c.id);

    let totalEvidence = 0;
    let upcomingDeadlines = 0;
    let upcomingTasks: Array<{
      id: number;
      caseId: number;
      title: string;
      description: string | null;
      phase: string;
      completed: boolean;
      dueDate: Date | null;
      sortOrder: number;
      createdAt: Date;
    }> = [];

    if (caseIds.length > 0) {
      const evidenceCount = await db
        .select({ count: count() })
        .from(evidenceTable)
        .where(sql`${evidenceTable.caseId} = ANY(${caseIds})`);
      totalEvidence = Number(evidenceCount[0]?.count ?? 0);

      const tasks = await db
        .select()
        .from(caseTasksTable)
        .where(
          sql`${caseTasksTable.caseId} = ANY(${caseIds}) AND ${caseTasksTable.completed} = false`
        )
        .orderBy(caseTasksTable.sortOrder)
        .limit(10);

      upcomingTasks = tasks;
      upcomingDeadlines = tasks.filter((t) => t.dueDate !== null).length;
    }

    const enrichedCases = await Promise.all(
      recentCases.map(async (c) => {
        const [evCount] = await db
          .select({ count: count() })
          .from(evidenceTable)
          .where(eq(evidenceTable.caseId, c.id));
        const [taskCount] = await db
          .select({ count: count() })
          .from(caseTasksTable)
          .where(eq(caseTasksTable.caseId, c.id));
        const [completedCount] = await db
          .select({ count: count() })
          .from(caseTasksTable)
          .where(and(eq(caseTasksTable.caseId, c.id), eq(caseTasksTable.completed, true)));

        return {
          ...c,
          evidenceCount: Number(evCount?.count ?? 0),
          taskCount: Number(taskCount?.count ?? 0),
          completedTaskCount: Number(completedCount?.count ?? 0),
        };
      })
    );

    return res.json({
      totalCases,
      activeCases,
      upcomingDeadlines,
      totalEvidence,
      recentCases: enrichedCases,
      upcomingTasks,
    });
  } catch (err) {
    logger.error({ err }, "Error fetching dashboard");
    return res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
