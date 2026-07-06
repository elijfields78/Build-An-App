import React, { useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetComplaint, getGetComplaintQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Download, PlayCircle, Loader2, Lock, Zap, Scale } from "lucide-react";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { useBillingStatus } from "@/hooks/useBillingStatus";

export default function CaseComplaint({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { getToken } = useAuth();
  const { data, isLoading } = useGetComplaint(id, { query: { enabled: !isNaN(id), queryKey: getGetComplaintQueryKey(id) } });
  const qc = useQueryClient();
  const { tier } = useBillingStatus();
  
  const [juryDemand, setJuryDemand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const isFreeTier = tier === "free";

  const handleGenerate = async () => {
    if (!confirm("This will overwrite your existing draft. Ensure you have completed the Story Builder and Jurisdiction Analyzer first. Continue?")) return;
    
    setIsGenerating(true);
    setStreamedText("");
    
    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${id}/complaint/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ juryDemand })
      });

      if (res.status === 403) {
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
          const chunk = decoder.decode(value);
          setStreamedText(prev => prev + chunk);
        }
      }
      
      qc.invalidateQueries({ queryKey: [`/api/cases/${id}/complaint`] });
      toast.success("Complaint generated successfully.");
    } catch (err) {
      toast.error("Failed to generate complaint");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = () => {
    if (isFreeTier) {
      setUpgradeOpen(true);
      return;
    }
    toast.info("PDF export coming soon.");
  };

  const textToDisplay = isGenerating ? streamedText : data?.complaintText;

  if (isLoading) {
    return (
      <CaseLayout caseId={params.id} title="Complaint Generator">
        <Skeleton className="h-[600px] w-full" />
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="Verified Complaint Generator">
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredTier="advocate"
        featureName="Complaint Export"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="text-lg font-serif">Generator Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isFreeTier && (
                <div className="rounded-lg bg-accent/20 border border-accent/30 p-4 text-xs text-foreground/90">
                  <div className="flex items-center gap-2 font-bold mb-2 text-accent">
                    <Lock className="h-4 w-4" />
                    Free Plan — Export Locked
                  </div>
                  <p className="leading-relaxed">You can generate and review your complaint draft. Upgrade to Advocate to export a clean, watermark-free PDF.</p>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-background/30">
                <div className="space-y-1">
                  <Label className="font-bold text-foreground text-sm">Jury Demand</Label>
                  <p className="text-xs text-muted-foreground">Request a trial by jury</p>
                </div>
                <Switch checked={juryDemand} onCheckedChange={setJuryDemand} disabled={isGenerating} />
              </div>
              
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full min-h-12 text-sm font-bold tracking-wide shadow-lg shadow-primary/20">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-5 w-5 mr-2" />
                    Draft Complaint
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-secondary/30 border-none">
            <CardContent className="p-6">
              <Scale className="h-6 w-6 mb-3 text-secondary-foreground opacity-70" />
              <h3 className="font-bold mb-3 text-xs uppercase tracking-widest text-foreground">Legal Warning</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                A complaint is a formal legal pleading. You must sign it under penalty of perjury (Rule 11).
              </p>
              <ul className="text-sm text-foreground/80 space-y-2 list-none">
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Read every word carefully</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Remove facts you cannot prove</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Verify all citations</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[750px] bg-card/50 backdrop-blur-sm border-border/50 shadow-xl shadow-black/5">
            <CardHeader className="border-b border-border/50 bg-muted/10 flex flex-row items-center justify-between py-4 px-6">
              <div>
                <CardTitle className="font-serif text-xl">Document Preview</CardTitle>
                <CardDescription className="text-xs font-mono uppercase tracking-wider mt-1">
                  {data?.status === 'draft' ? 'Draft Mode' : data?.status === 'final' ? 'Finalized' : 'Not generated yet'}
                  {isFreeTier && textToDisplay && " — WATERMARKED"}
                </CardDescription>
              </div>
              {textToDisplay && (
                isFreeTier ? (
                  <Button variant="outline" size="sm" onClick={handleExport} className="text-accent border-accent/30 hover:bg-accent/10 font-bold tracking-wide">
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade to Export
                  </Button>
                ) : (
                  <Button variant="default" size="sm" onClick={handleExport} className="font-bold tracking-wide shadow-md">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                )
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative bg-black/20">
              {textToDisplay ? (
                <div className="relative h-full overflow-hidden">
                  <div className="absolute inset-0 overflow-auto p-8">
                    <pre className="font-mono text-sm leading-[1.8] text-foreground/90 whitespace-pre-wrap max-w-3xl mx-auto">
                      {textToDisplay}
                    </pre>
                  </div>
                  {isFreeTier && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
                      <div className="rotate-[-30deg] text-white/5 text-7xl font-black tracking-widest select-none whitespace-nowrap drop-shadow-lg mix-blend-overlay">
                        DRAFT — UPGRADE TO EXPORT
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                  <div className="p-6 bg-muted/30 rounded-full mb-6">
                    <FileText className="h-12 w-12 text-muted-foreground opacity-50" />
                  </div>
                  <p className="font-serif font-bold text-xl text-foreground mb-2">No complaint generated yet</p>
                  <p className="text-sm max-w-md leading-relaxed">Complete the Story Builder and Jurisdiction Analyzer, then click "Draft Complaint" to generate your initial pleading.</p>
                </div>
              )}
            </CardContent>
            {isFreeTier && textToDisplay && (
              <CardFooter className="border-t border-border/50 bg-accent/10 py-3 px-6">
                <p className="text-xs text-accent flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  Watermarked draft preview —{" "}
                  <button onClick={() => setUpgradeOpen(true)} className="underline font-bold hover:text-accent-foreground">
                    upgrade to Advocate
                  </button>{" "}
                  to export a clean, court-ready PDF.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </CaseLayout>
  );
}