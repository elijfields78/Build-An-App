import React, { useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, PlayCircle, Loader2, Lock, Zap, Download, Send } from "lucide-react";
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
        <p className="text-muted-foreground">Invalid case ID.</p>
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="Dispute & Demand Letters">
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredTier="advocate"
        featureName="Dispute Letter Generator"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg shadow-black/5">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="text-lg font-serif">Letter Settings</CardTitle>
              <CardDescription className="text-xs mt-1">Choose the type of letter to generate</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isFreeTier && letterUsage && (
                <div className="rounded-xl bg-accent/10 border border-accent/20 p-4 text-sm text-foreground/90">
                  <div className="flex items-center justify-between font-bold mb-2">
                    <span className="text-accent">Monthly usage</span>
                    <span className="font-mono text-xs">{letterUsage.used}/{letterUsage.limit}</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.min(100, (letterUsage.used / letterUsage.limit) * 100)}%` }}
                    />
                  </div>
                  {atLimit ? (
                    <button
                      onClick={() => setUpgradeOpen(true)}
                      className="w-full text-center font-bold text-accent hover:text-accent-foreground flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Zap className="h-3.5 w-3.5" /> Upgrade for unlimited
                    </button>
                  ) : (
                    <p className="text-accent font-medium text-xs">{letterUsage.limit - letterUsage.used} letter{letterUsage.limit - letterUsage.used !== 1 ? "s" : ""} remaining</p>
                  )}
                </div>
              )}

              <div className="space-y-2.5">
                <Label htmlFor="letterType" className="text-sm font-bold">Letter Type</Label>
                <Select value={letterType} onValueChange={setLetterType} disabled={isGenerating}>
                  <SelectTrigger id="letterType" className="h-11 bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LETTER_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="font-medium">{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {atLimit ? (
                <Button className="w-full min-h-12 font-bold shadow-md bg-[#D4A843] hover:bg-[#b58f38] text-black" onClick={() => setUpgradeOpen(true)}>
                  <Zap className="h-4 w-4 mr-2" />
                  Upgrade to Continue
                </Button>
              ) : (
                <Button onClick={handleGenerate} disabled={isGenerating} className="w-full min-h-12 font-bold shadow-md shadow-primary/20 tracking-wide">
                  {isGenerating ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><PlayCircle className="h-5 w-5 mr-2" /> Generate Letter</>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-none">
            <CardContent className="p-6 text-sm text-foreground/80 space-y-3">
              <p className="font-bold uppercase tracking-widest text-foreground flex items-center gap-2 mb-4">
                <Send className="h-4 w-4 text-primary" /> Before You Send
              </p>
              <ul className="list-none space-y-2">
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Review every fact for accuracy</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Send via certified mail with return receipt</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Keep a copy for your records</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Consult an attorney before sending</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[750px] bg-card/50 backdrop-blur-sm border-border/50 shadow-xl shadow-black/5">
            <CardHeader className="border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between py-4 px-6">
              <div>
                <CardTitle className="font-serif text-xl">
                  {LETTER_TYPES.find(t => t.value === letterType)?.label ?? "Letter"} Preview
                </CardTitle>
                <CardDescription className="text-xs font-mono uppercase tracking-wider mt-1">
                  {letterText ? "Review carefully before sending" : "Click Generate to draft your letter"}
                </CardDescription>
              </div>
              {letterText && !isGenerating && (
                <Button variant="default" size="sm" onClick={() => toast.info("PDF export coming soon.")} className="font-bold tracking-wide shadow-md">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative bg-black/20">
              {letterText ? (
                <div className="absolute inset-0 overflow-auto p-8">
                  <pre className="font-mono text-sm leading-[1.8] text-foreground/90 whitespace-pre-wrap max-w-3xl mx-auto">
                    {letterText}
                  </pre>
                  {isGenerating && (
                    <span className="inline-block w-2 h-5 bg-primary animate-pulse ml-1 align-middle shadow-[0_0_8px_rgba(var(--primary),0.8)]" />
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <div className="p-6 bg-muted/30 rounded-full mb-6">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                  </div>
                  <p className="font-serif font-bold text-xl text-foreground mb-2">No letter generated yet</p>
                  <p className="text-sm max-w-sm leading-relaxed">
                    Select a letter type and click "Generate Letter" to create your AI-drafted correspondence.
                  </p>
                </div>
              )}
            </CardContent>
            {letterText && !isGenerating && (
              <CardFooter className="border-t border-border/50 bg-muted/5 py-3 px-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Lock className="h-3 w-3" />
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