export type LitigationMatterType =
  | "fcra"
  | "fdcpa"
  | "landlord_tenant"
  | "contract"
  | "small_claims"
  | "civil_rights"
  | "general_civil"
  | "appeal";

export type UserPosture = "plaintiff" | "defendant" | "research" | "appellant" | "appellee";

export type Playbook = {
  id: LitigationMatterType;
  label: string;
  description: string;
  postures: UserPosture[];
  intakeSections: string[];
  evidenceChecklist: string[];
  proceduralRisks: string[];
  draftTypes: string[];
  researchStarters: string[];
  safetyNotes: string[];
};

export const PLAYBOOKS: Record<LitigationMatterType, Playbook> = {
  fcra: {
    id: "fcra",
    label: "Credit Reporting / FCRA",
    description: "Credit report disputes, CRA reinvestigation, furnisher notice, CFPB complaints, and FCRA litigation readiness.",
    postures: ["plaintiff", "research"],
    intakeSections: ["credit report", "bureau", "furnisher", "tradeline", "dispute chronology", "harm inventory"],
    evidenceChecklist: ["credit reports", "dispute letters", "certified mail proof", "bureau responses", "denial letters", "damages proof"],
    proceduralRisks: ["standing/concrete harm", "CRA dispute gate", "furnisher notice", "statute of limitations", "jurisdiction/venue"],
    draftTypes: ["dispute letter", "opportunity to cure", "intent to litigate", "CFPB complaint", "complaint outline"],
    researchStarters: ["15 U.S.C. § 1681i", "15 U.S.C. § 1681s-2(b)", "TransUnion v. Ramirez", "Spokeo v. Robins", "Cushman v. Trans Union"],
    safetyNotes: ["Verify dispute chronology and harm evidence before drafting claims."],
  },
  fdcpa: {
    id: "fdcpa",
    label: "Debt Collection / FDCPA",
    description: "Debt validation, collection lawsuits, debt buyer proof, time-barred debt, and collection conduct logs.",
    postures: ["plaintiff", "defendant", "research"],
    intakeSections: ["collector identity", "debt owner", "amount claimed", "communications", "lawsuit status", "debt age"],
    evidenceChecklist: ["collection letters", "call logs", "summons/complaint", "account statements", "assignment documents", "credit reports"],
    proceduralRisks: ["answer deadline", "statute of limitations", "collector status", "standing/assignment", "arbitration clause"],
    draftTypes: ["validation request", "answer outline", "discovery requests", "settlement log", "FDCPA complaint outline"],
    researchStarters: ["15 U.S.C. § 1692g", "15 U.S.C. § 1692e", "McCollough v. Johnson Rodenburg", "Heintz v. Jenkins", "Jerman v. Carlisle"],
    safetyNotes: ["Debt collection deadlines can be short; verify summons and local court rules immediately."],
  },
  landlord_tenant: {
    id: "landlord_tenant",
    label: "Landlord-Tenant / Eviction",
    description: "Repair requests, habitability, retaliation, notices, rent ledger, eviction response, and hearing preparation.",
    postures: ["plaintiff", "defendant", "research"],
    intakeSections: ["state/county", "role", "lease", "notice", "rent ledger", "repair/habitability timeline", "hearing date"],
    evidenceChecklist: ["lease", "notices", "photos", "repair requests", "code reports", "rent receipts", "messages"],
    proceduralRisks: ["notice period", "answer/hearing deadline", "state-specific rules", "retaliation timing", "habitability evidence"],
    draftTypes: ["repair request", "opportunity to cure", "answer outline", "hearing script", "exhibit list"],
    researchStarters: ["Javins v. First National Realty", "Green v. Superior Court", "Lindsey v. Normet"],
    safetyNotes: ["Eviction deadlines can be urgent and highly local; verify immediately."],
  },
  contract: {
    id: "contract",
    label: "Contract Dispute",
    description: "Formation, breach, performance, damages, notice/cure, demand letters, and contract litigation readiness.",
    postures: ["plaintiff", "defendant", "research"],
    intakeSections: ["contract terms", "parties", "performance", "breach", "notice/cure", "damages", "forum/arbitration clauses"],
    evidenceChecklist: ["contract", "invoices", "payments", "messages", "performance proof", "breach notice", "damages records"],
    proceduralRisks: ["statute of limitations", "arbitration/forum clause", "damages proof", "notice/cure requirement"],
    draftTypes: ["notice of breach", "opportunity to cure", "demand letter", "complaint outline", "answer outline"],
    researchStarters: ["Lucy v. Zehmer", "Hamer v. Sidway", "Hadley v. Baxendale", "Williams v. Walker-Thomas Furniture"],
    safetyNotes: ["Contract law varies by state; verify governing law and forum clauses."],
  },
  small_claims: {
    id: "small_claims",
    label: "Small Claims",
    description: "Simplified claim preparation, evidence packets, service, hearing preparation, and judgment collection basics.",
    postures: ["plaintiff", "defendant", "research"],
    intakeSections: ["state/county", "claim amount", "party names", "demand history", "evidence", "hearing date"],
    evidenceChecklist: ["contract/receipt", "photos", "messages", "demand letter", "payment proof", "witness notes"],
    proceduralRisks: ["claim limit", "proper defendant", "service", "hearing date", "counterclaim deadline"],
    draftTypes: ["demand letter", "claim summary", "hearing script", "exhibit list"],
    researchStarters: ["state small claims self-help", "Mullane notice standard", "local small claims rules"],
    safetyNotes: ["Small claims limits and procedures are state/county-specific."],
  },
  civil_rights: {
    id: "civil_rights",
    label: "Civil Rights / §1983",
    description: "State actor, constitutional right, personal involvement, Monell issues, qualified immunity, and evidence organization.",
    postures: ["plaintiff", "defendant", "research"],
    intakeSections: ["state actor", "right violated", "defendant role", "timeline", "injury", "exhaustion", "policy/custom"],
    evidenceChecklist: ["bodycam/video", "reports", "grievances", "medical records", "witnesses", "photos", "policies"],
    proceduralRisks: ["qualified immunity", "Monell policy/custom", "personal involvement", "exhaustion", "limitations"],
    draftTypes: ["claim outline", "complaint preflight", "qualified immunity research", "evidence matrix"],
    researchStarters: ["42 U.S.C. § 1983", "Monell", "Graham v. Connor", "Hope v. Pelzer", "Tennessee v. Garner"],
    safetyNotes: ["Civil rights claims are complex; verify exhaustion, immunity, and limitations issues."],
  },
  general_civil: {
    id: "general_civil",
    label: "General Civil Litigation",
    description: "Federal/state civil procedure, complaint/answer workflows, motions, discovery, deadlines, and settlement readiness.",
    postures: ["plaintiff", "defendant", "research"],
    intakeSections: ["court", "parties", "jurisdiction", "venue", "claims", "relief", "timeline", "service"],
    evidenceChecklist: ["key documents", "communications", "witnesses", "damages proof", "service proof", "court orders"],
    proceduralRisks: ["Rule 12", "service", "venue", "standing", "limitations", "summary judgment", "local rules"],
    draftTypes: ["complaint", "answer", "motion response", "discovery requests", "settlement demand"],
    researchStarters: ["FRCP 8", "FRCP 12", "Twombly", "Iqbal", "Haines", "Celotex"],
    safetyNotes: ["Procedure and local rules often decide cases before merits; verify court-specific requirements."],
  },
  appeal: {
    id: "appeal",
    label: "Appeals Preparation",
    description: "Notice of appeal timing, issue preservation, record organization, standards of review, and brief outlining.",
    postures: ["appellant", "appellee", "research"],
    intakeSections: ["order/judgment", "entry date", "court", "issues", "preservation", "record", "deadline"],
    evidenceChecklist: ["judgment/order", "docket", "motions", "transcripts", "exhibits", "notice of appeal"],
    proceduralRisks: ["appeal deadline", "finality", "preservation", "record designation", "standard of review"],
    draftTypes: ["notice checklist", "issue list", "record index", "brief outline"],
    researchStarters: ["FRAP 4", "standards of review", "final judgment rule"],
    safetyNotes: ["Appeal deadlines can be strict and jurisdictional; verify immediately."],
  },
};

export function getPlaybook(id: LitigationMatterType) {
  return PLAYBOOKS[id];
}

export function listPlaybooks() {
  return [
    PLAYBOOKS.fcra,
    PLAYBOOKS.fdcpa,
    PLAYBOOKS.landlord_tenant,
    PLAYBOOKS.contract,
    PLAYBOOKS.small_claims,
    PLAYBOOKS.civil_rights,
    PLAYBOOKS.general_civil,
    PLAYBOOKS.appeal,
  ];
}
