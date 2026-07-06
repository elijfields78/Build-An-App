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
import { FileText, Download, PlayCircle, Loader2, Lock, Zap } from "lucide-react";
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
    if (isFreeTier) {
      setUpgradeOpen(true);
      return;
    }
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

  const textToDisplay = isGenerating ? streamedText : data?.complaintText;

  if (isLoading) {
    return (
      <CaseLayout caseId={params.id} title="Complaint Generator">
        <Skeleton className="h-[500px] w-full" />
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="Verified Complaint Generator">
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredTier="advocate"
        featureName="Complaint Generator"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Generator Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {isFreeTier && (
                <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Lock className="h-3 w-3" />
                    Advocate Plan Required
                  </div>
                  <p>AI complaint generation requires the Advocate plan. Upgrade to draft, edit, and export your verified complaint.</p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Jury Demand</Label>
                  <p className="text-xs text-slate-500">Request a trial by jury</p>
                </div>
                <Switch checked={juryDemand} onCheckedChange={setJuryDemand} disabled={isGenerating || isFreeTier} />
              </div>
              
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                variant={isFreeTier ? "outline" : "default"}
              >
                {isFreeTier ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 text-amber-500" />
                    Upgrade to Generate
                  </>
                ) : isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Draft Complaint
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card className="bg-blue-900 text-white border-none">
            <CardContent className="p-6">
              <h3 className="font-bold mb-2 text-sm uppercase tracking-wider">Legal Warning</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                A complaint is a formal legal pleading. You must sign it under penalty of perjury (Rule 11).
              </p>
              <ul className="text-sm opacity-90 space-y-2 list-disc list-inside ml-2">
                <li>Read every word carefully</li>
                <li>Remove any facts you cannot prove</li>
                <li>Verify all citations</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="flex flex-col h-[700px]">
            <CardHeader className="border-b bg-slate-50 flex flex-row items-center justify-between py-3">
              <div>
                <CardTitle className="font-serif text-lg">Document Preview</CardTitle>
                <CardDescription>
                  {data?.status === 'draft' ? 'Draft Mode' : data?.status === 'final' ? 'Finalized' : 'Not generated yet'}
                </CardDescription>
              </div>
              {textToDisplay && (
                isFreeTier ? (
                  <Button variant="outline" size="sm" onClick={() => setUpgradeOpen(true)} className="text-amber-700 border-amber-300 hover:bg-amber-50">
                    <Lock className="h-4 w-4 mr-2" />
                    Upgrade to Export
                  </Button>
                ) : (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                )
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {textToDisplay ? (
                <div className="relative h-full">
                  <Textarea 
                    value={textToDisplay} 
                    readOnly 
                    className="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 p-6 font-mono text-sm leading-relaxed" 
                  />
                  {isFreeTier && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="rotate-[-30deg] text-slate-200 text-5xl font-black tracking-widest opacity-30 select-none whitespace-nowrap">
                        FREE PLAN — UPGRADE TO EXPORT
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <FileText className="h-12 w-12 mb-4 text-slate-300" />
                  <p className="font-semibold text-slate-700">No complaint generated</p>
                  <p className="text-sm max-w-sm mt-2">
                    {isFreeTier
                      ? "Upgrade to the Advocate plan to generate your AI-drafted verified complaint."
                      : "Complete the Story Builder and Jurisdiction Analyzer, then click \"Draft Complaint\" to generate your initial pleading."}
                  </p>
                  {isFreeTier && (
                    <Button size="sm" className="mt-4 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => setUpgradeOpen(true)}>
                      <Zap className="h-3.5 w-3.5 mr-1.5" /> Upgrade to Advocate
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
            {isFreeTier && textToDisplay && (
              <CardFooter className="border-t bg-amber-50 py-2 px-4">
                <p className="text-xs text-amber-700 flex items-center gap-1.5">
                  <Lock className="h-3 w-3" />
                  Watermarked preview — <button onClick={() => setUpgradeOpen(true)} className="underline font-semibold hover:text-amber-900">upgrade to Advocate</button> to export a clean PDF.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </CaseLayout>
  );
}
