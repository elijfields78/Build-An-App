export const LEGAL_INFORMATION_DISCLAIMER =
  "Pro Se Navigator is not a law firm and does not provide legal advice. No attorney-client relationship is created. Outputs are educational drafts, research assistance, and organizational support. Verify all facts, deadlines, statutes, court rules, and local rules before filing. Consult a licensed attorney or legal aid organization when possible.";

export type ComplianceRiskLevel = "low" | "medium" | "high" | "critical";

export type ComplianceNotice = {
  riskLevel: ComplianceRiskLevel;
  disclaimer: string;
  verificationSteps: string[];
};

export function buildComplianceNotice(riskLevel: ComplianceRiskLevel = "medium"): ComplianceNotice {
  return {
    riskLevel,
    disclaimer: LEGAL_INFORMATION_DISCLAIMER,
    verificationSteps: [
      "Verify all deadlines against the docket, court orders, rules, and local rules.",
      "Verify every case, statute, quotation, and citation before filing.",
      "Confirm that jurisdiction, venue, service, and procedural posture are correct for the specific court.",
      "Consider contacting licensed counsel, legal aid, or the court self-help center when possible.",
    ],
  };
}

export function appendComplianceFooter(text: string, riskLevel: ComplianceRiskLevel = "medium") {
  const notice = buildComplianceNotice(riskLevel);
  return `${text.trim()}\n\n---\n${notice.disclaimer}`;
}

export const COMPLIANCE_SYSTEM_INSTRUCTIONS = `
You are assisting a self-represented litigant with legal-information, organization, research, and educational drafting support.
You are not a lawyer, law firm, or substitute for legal counsel.
Do not guarantee outcomes or tell the user what they must file.
Frame procedural options as issues to research and verify.
Require verification of deadlines, local rules, citations, court orders, facts, and filing requirements.
Do not include unverified case law in filing drafts; unverified authority belongs in a research-leads section only.
`.trim();
