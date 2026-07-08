import type { ComponentType } from "react";
import {
  BookOpenCheck,
  BrainCircuit,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  FileSearch,
  FileStack,
  FileText,
  Gavel,
  Handshake,
  Info,
  LibraryBig,
  Mail,
  Scale,
  ShieldAlert,
  UploadCloud,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

import CaseHome from "@/pages/cases/[id]";
import CaseStory from "@/pages/cases/[id]/story";
import CaseEvidence from "@/pages/cases/[id]/evidence";
import CaseJurisdiction from "@/pages/cases/[id]/jurisdiction";
import CaseIfp from "@/pages/cases/[id]/ifp";
import CaseComplaint from "@/pages/cases/[id]/complaint";
import CaseCourtDocuments from "@/pages/cases/[id]/court-documents";
import CaseTasks from "@/pages/cases/[id]/tasks";
import CaseDisputeLetter from "@/pages/cases/[id]/dispute-letter";
import CaseAdministrativeProcess from "@/pages/cases/[id]/administrative";
import CaseLawBank from "@/pages/cases/[id]/case-law";
import CaseDocketDeadlines from "@/pages/cases/[id]/deadlines";
import CaseMemory from "@/pages/cases/[id]/memory";
import ProceduralRiskEngine from "@/pages/cases/[id]/procedural-risk";
import SettlementLeverageCenter from "@/pages/cases/[id]/settlement";
import DraftReviewCenter from "@/pages/cases/[id]/draft-review";
import AgentOrchestrator from "@/pages/cases/[id]/agents";
import LegalPlaybookCenter from "@/pages/cases/[id]/playbooks";
import LitigationTimeline from "@/pages/cases/[id]/timeline";
import DocumentAssemblyCenter from "@/pages/cases/[id]/documents";
import ServiceDefaultCenter from "@/pages/cases/[id]/service";
import DiscoveryCommandCenter from "@/pages/cases/[id]/discovery";
import MotionOrderCockpit from "@/pages/cases/[id]/motions";
import AppealsReconsiderationTriage from "@/pages/cases/[id]/appeals";

type CasePageComponent = ComponentType<{ params: { id: string } }>;

export type CaseModuleGroup = "Command" | "Build Record" | "Draft & File" | "Deadlines & Risk" | "Research & AI" | "Resolution";

export type CaseModule = {
  slug: string;
  name: string;
  icon: LucideIcon;
  component: CasePageComponent;
  group: CaseModuleGroup;
  priority: number;
};

const caseModuleDefinitions: CaseModule[] = [
  { slug: "", name: "Overview", icon: Info, component: CaseHome, group: "Command", priority: 0 },
  { slug: "playbooks", name: "Playbooks", icon: LibraryBig, component: LegalPlaybookCenter, group: "Command", priority: 1 },
  { slug: "memory", name: "Memory", icon: BrainCircuit, component: CaseMemory, group: "Command", priority: 2 },
  { slug: "timeline", name: "Timeline", icon: CalendarDays, component: LitigationTimeline, group: "Build Record", priority: 10 },
  { slug: "story", name: "Story", icon: FileText, component: CaseStory, group: "Build Record", priority: 11 },
  { slug: "evidence", name: "Evidence", icon: UploadCloud, component: CaseEvidence, group: "Build Record", priority: 12 },
  { slug: "administrative", name: "Admin Process", icon: ClipboardList, component: CaseAdministrativeProcess, group: "Build Record", priority: 13 },
  { slug: "dispute-letter", name: "Letters", icon: Mail, component: CaseDisputeLetter, group: "Build Record", priority: 14 },
  { slug: "complaint", name: "Complaint", icon: FileSearch, component: CaseComplaint, group: "Draft & File", priority: 20 },
  { slug: "draft-review", name: "Draft Review", icon: Gavel, component: DraftReviewCenter, group: "Draft & File", priority: 21 },
  { slug: "documents", name: "Packets", icon: FileStack, component: DocumentAssemblyCenter, group: "Draft & File", priority: 22 },
  { slug: "court-documents", name: "Court Docs", icon: ShieldAlert, component: CaseCourtDocuments, group: "Draft & File", priority: 23 },
  { slug: "jurisdiction", name: "Jurisdiction", icon: Scale, component: CaseJurisdiction, group: "Deadlines & Risk", priority: 30 },
  { slug: "procedural-risk", name: "Risk", icon: ShieldAlert, component: ProceduralRiskEngine, group: "Deadlines & Risk", priority: 31 },
  { slug: "deadlines", name: "Docket", icon: CalendarClock, component: CaseDocketDeadlines, group: "Deadlines & Risk", priority: 32 },
  { slug: "service", name: "Service", icon: UserCheck, component: ServiceDefaultCenter, group: "Deadlines & Risk", priority: 33 },
  { slug: "discovery", name: "Discovery", icon: FileSearch, component: DiscoveryCommandCenter, group: "Deadlines & Risk", priority: 34 },
  { slug: "motions", name: "Motions", icon: Gavel, component: MotionOrderCockpit, group: "Deadlines & Risk", priority: 35 },
  { slug: "appeals", name: "Appeals", icon: Scale, component: AppealsReconsiderationTriage, group: "Deadlines & Risk", priority: 36 },
  { slug: "tasks", name: "Tasks", icon: CheckSquare, component: CaseTasks, group: "Deadlines & Risk", priority: 37 },
  { slug: "ifp", name: "IFP", icon: Briefcase, component: CaseIfp, group: "Deadlines & Risk", priority: 38 },
  { slug: "case-law", name: "Case Law", icon: BookOpenCheck, component: CaseLawBank, group: "Research & AI", priority: 40 },
  { slug: "agents", name: "Agents", icon: BrainCircuit, component: AgentOrchestrator, group: "Research & AI", priority: 41 },
  { slug: "settlement", name: "Settlement", icon: Handshake, component: SettlementLeverageCenter, group: "Resolution", priority: 50 },
];

export const caseModules: CaseModule[] = [...caseModuleDefinitions].sort((a, b) => a.priority - b.priority);

export const caseModuleGroups: CaseModuleGroup[] = [
  "Command",
  "Build Record",
  "Draft & File",
  "Deadlines & Risk",
  "Research & AI",
  "Resolution",
];

export function caseModuleHref(caseId: string, slug: string) {
  return slug ? `/cases/${caseId}/${slug}` : `/cases/${caseId}`;
}

export function caseModuleRoutePath(slug: string) {
  return slug ? `/cases/:id/${slug}` : "/cases/:id";
}
