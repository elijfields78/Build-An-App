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
import { FileText, Download, PlayCircle, Loader2 } from "lucide-react";

export default function CaseComplaint({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { getToken } = useAuth();
  const { data, isLoading } = useGetComplaint(id, { query: { enabled: !isNaN(id), queryKey: getGetComplaintQueryKey(id) } });
  const qc = useQueryClient();
  
  const [juryDemand, setJuryDemand] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamedText, setStreamedText] = useState("");

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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Generator Settings</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Jury Demand</Label>
                  <p className="text-xs text-slate-500">Request a trial by jury</p>
                </div>
                <Switch checked={juryDemand} onCheckedChange={setJuryDemand} disabled={isGenerating} />
              </div>
              
              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PlayCircle className="h-4 w-4 mr-2" />}
                {isGenerating ? "Generating..." : "Draft Complaint"}
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
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {textToDisplay ? (
                <Textarea 
                  value={textToDisplay} 
                  readOnly 
                  className="w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 p-6 font-mono text-sm leading-relaxed" 
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <FileText className="h-12 w-12 mb-4 text-slate-300" />
                  <p className="font-semibold text-slate-700">No complaint generated</p>
                  <p className="text-sm max-w-sm mt-2">Complete the Story Builder and Jurisdiction Analyzer, then click "Draft Complaint" to generate your initial pleading.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </CaseLayout>
  );
}
