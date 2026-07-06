import React, { useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { FileText, PlayCircle, Loader2, Lock, Zap, Download } from "lucide-react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { useBillingStatus } from "@/hooks/useBillingStatus";

const LETTER_TYPES = [
  { value: "demand", label: "Demand Letter" },
  { value: "cease-and-desist", label: "Cease and Desist" },
  { value: "dispute", label: "Formal Dispute Letter" },
];

export default function CaseDisputeLetter({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { getToken } = useAuth();
  const { tier, usage } = useBillingStatus();

  const [letterType, setLetterType] = useState("demand");
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterText, setLetterText] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isFreeTier = tier === "free";
  const letterUsage = usage?.dispute_letter;
  const atLimit = isFreeTier && letterUsage && letterUsage.used >= letterUsage.limit;

  const handleGenerate = async () => {
    if (!confirm("This will generate a new letter draft. Continue?")) return;

    setIsGenerating(true);
    setLetterText("");

    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${id}/dispute-letter/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ letterType }),
      });

      if (res.status === 403) {
        const body = await res.json() as { requiredTier?: "advocate" | "warroom" };
        setUpgradeOpen(true);
        setIsGenerating(false);
        return;
      }

      if (!res.ok) throw new Error("Generation failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          setLetterText(prev => prev + decoder.decode(value));
        }
      }

      toast.success("Letter generated successfully.");
    } catch (err) {
      toast.error("Failed to generate letter");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isNaN(id)) {
    return (
      <CaseLayout caseId={params.id} title="Dispute Letter Generator">
        <p className="text-slate-500">Invalid case ID.</p>
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="Dispute & Demand Letter Generator">
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredTier="advocate"
        featureName="Dispute Letter Generator"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Letter Settings</CardTitle>
              <CardDescription>Choose the type of letter to generate</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {isFreeTier && letterUsage && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <div className="flex items-center justify-between font-semibold mb-1.5">
                    <span>Monthly letter usage</span>
                    <span>{letterUsage.used}/{letterUsage.limit}</span>
                  </div>
                  <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (letterUsage.used / letterUsage.limit) * 100)}%` }}
                    />
                  </div>
                  {atLimit ? (
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="w-full text-center font-bold text-amber-700 hover:text-amber-900 flex items-center justify-center gap-1"
                    >
                      <Zap className="h-3 w-3" /> Upgrade for unlimited letters
                    </button>
                  ) : (
                    <p className="text-amber-700">{letterUsage.limit - letterUsage.used} letter{letterUsage.limit - letterUsage.used !== 1 ? "s" : ""} remaining this month</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="letterType">Letter Type</Label>
                <Select value={letterType} onValueChange={setLetterType} disabled={isGenerating}>
                  <SelectTrigger id="letterType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LETTER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {atLimit ? (
                <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setUpgradeOpen(true)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade to Continue
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                  {isGenerating ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><PlayCircle className="h-4 w-4 mr-2" /> Generate Letter</>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-5 text-xs text-amber-900 space-y-2">
              <p className="font-bold uppercase tracking-wider text-amber-800">Before You Send</p>
              <ul className="list-disc list-inside space-y-1 opacity-90">
                <li>Review every fact for accuracy</li>
                <li>Send via certified mail with return receipt</li>
                <li>Keep a copy for your records</li>
                <li>Consult an attorney before sending</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[700px]">
            <CardHeader className="border-b bg-slate-50 flex flex-row items-center justify-between py-3">
              <div>
                <CardTitle className="font-serif text-lg">
                  {LETTER_TYPES.find(t => t.value === letterType)?.label ?? "Letter"} Preview
                </CardTitle>
                <CardDescription>
                  {letterText ? "Review carefully before sending" : "Click Generate to draft your letter"}
                </CardDescription>
              </div>
              {letterText && !isGenerating && (
                <Button variant="outline" size="sm" onClick={() => toast.info("PDF export coming soon.")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {letterText ? (
                <Textarea
                  value={letterText}
                  readOnly
                  className="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 p-6 font-mono text-sm leading-relaxed"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <FileText className="h-12 w-12 mb-4 text-slate-300" />
                  <p className="font-semibold text-slate-700">No letter generated yet</p>
                  <p className="text-sm max-w-sm mt-2">
                    Select a letter type and click "Generate Letter" to create your AI-drafted correspondence.
                  </p>
                </div>
              )}
              {isGenerating && letterText && (
                <div className="absolute bottom-4 right-4">
                  <span className="inline-block w-1.5 h-5 bg-primary animate-pulse rounded-sm" />
                </div>
              )}
            </CardContent>
            {letterText && !isGenerating && (
              <CardFooter className="border-t bg-slate-50 py-2 px-4">
                <p className="text-xs text-slate-500">
                  Always verify facts and consult a licensed attorney before sending legal correspondence.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </CaseLayout>
  );
}
