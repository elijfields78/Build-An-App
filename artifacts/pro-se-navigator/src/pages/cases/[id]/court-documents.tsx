import React, { useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useListCourtDocuments, useDeleteCourtDocument, getListCourtDocumentsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, FileText, UploadCloud, ShieldAlert, FileWarning, Clock, Zap, ScanText } from "lucide-react";
import { format } from "date-fns";
import { UpgradeModal } from "@/components/billing/UpgradeModal";
import { useBillingStatus } from "@/hooks/useBillingStatus";

export default function CaseCourtDocuments({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { getToken } = useAuth();
  const { data, isLoading } = useListCourtDocuments(id, { query: { enabled: !isNaN(id), queryKey: getListCourtDocumentsQueryKey(id) } });
  const deleteItem = useDeleteCourtDocument();
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { tier, usage } = useBillingStatus();

  const scanUsage = usage?.court_doc_scan;
  const atLimit = tier === "free" && scanUsage && scanUsage.used >= scanUsage.limit;

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/cases/${id}/court-documents`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (res.status === 403) {
        setUpgradeOpen(true);
        return;
      }

      if (!res.ok) throw new Error("Upload failed");
      toast.success("Document uploaded successfully");
      qc.invalidateQueries({ queryKey: [`/api/cases/${id}/court-documents`] });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (docId: number) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    deleteItem.mutate({ id, did: docId }, {
      onSuccess: () => {
        toast.success("Document deleted");
        qc.invalidateQueries({ queryKey: [`/api/cases/${id}/court-documents`] });
      },
      onError: () => toast.error("Failed to delete document")
    });
  };

  return (
    <CaseLayout caseId={params.id} title="Court Document Scanner">
      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        requiredTier="advocate"
        featureName="Court Document Scanner"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50 shadow-lg shadow-black/5">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="text-lg font-serif">Scan Document</CardTitle>
              <CardDescription className="text-xs mt-1">Upload motions, orders, or notices you received from the court or opposing counsel.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {tier === "free" && scanUsage && (
                <div className="mb-5 p-4 rounded-xl bg-accent/10 border border-accent/20 text-foreground/90 text-sm">
                  <div className="flex items-center justify-between font-bold mb-2">
                    <span className="text-accent">Free tier usage</span>
                    <span className="font-mono text-xs">{scanUsage.used}/{scanUsage.limit} scans</span>
                  </div>
                  <div className="h-1.5 bg-background rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${Math.min(100, (scanUsage.used / scanUsage.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {atLimit ? (
                <div className="text-center py-6 border border-border/50 rounded-xl bg-background/30">
                  <p className="text-base text-foreground font-bold font-serif mb-2">Scan limit reached</p>
                  <p className="text-sm text-muted-foreground mb-4">Upgrade for unlimited court document scanning.</p>
                  <Button onClick={() => setUpgradeOpen(true)} className="bg-[#D4A843] hover:bg-[#b58f38] text-black font-bold">
                    <Zap className="h-4 w-4 mr-2" /> Upgrade to Advocate
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-5">
                  <div className="space-y-2.5">
                    <Label htmlFor="file" className="text-sm font-bold text-foreground">Select PDF or Image</Label>
                    <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required className="bg-background/50" />
                  </div>
                  <Button type="submit" disabled={isUploading} className="w-full min-h-12 font-bold shadow-md shadow-primary/20">
                    <ScanText className="h-4 w-4 mr-2" />
                    {isUploading ? "Scanning..." : "Upload & Analyze"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-destructive/10 border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ShieldAlert className="w-24 h-24 text-destructive" />
            </div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center gap-2 font-bold mb-3 text-destructive tracking-tight text-lg font-serif">
                <ShieldAlert className="h-5 w-5" />
                Deadlines Matter
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">
                If you receive a "Motion to Dismiss" or "Motion for Summary Judgment", you usually have 14 to 21 days to respond. If you miss the deadline, you lose the case automatically. Always verify local rules.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : data?.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted/30 rounded-full mb-4">
                  <FileWarning className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-2">No Documents Uploaded</h3>
                <p className="text-sm text-muted-foreground max-w-sm">Upload documents you receive to get AI translation and deadline extraction.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {data?.map(doc => (
                <Card key={doc.id} className="overflow-hidden shadow-lg shadow-black/5 bg-card/50 backdrop-blur-sm border-border/50 group">
                  <CardHeader className="bg-muted/10 border-b border-border/50 pb-3 pt-4 px-6 flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <FileText className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base font-serif tracking-tight">{doc.fileName}</CardTitle>
                      </div>
                      <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                        <span className="uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">{doc.documentType || 'Unknown Type'}</span>
                        <span>•</span>
                        <span>{format(new Date(doc.uploadedAt), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
                      <div className="p-6 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Plain English Summary</h4>
                          <p className="text-sm text-foreground/90 leading-relaxed font-medium">{doc.plainEnglishSummary || 'Analysis pending...'}</p>
                        </div>
                        {doc.whatItMeans && (
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">What It Means</h4>
                            <p className="text-sm text-foreground/80 leading-relaxed">{doc.whatItMeans}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-6 space-y-6 bg-background/30">
                        {doc.deadlinesIdentified && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-2 flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5" /> Identified Deadlines
                            </h4>
                            <p className="text-sm text-destructive font-bold">{doc.deadlinesIdentified}</p>
                          </div>
                        )}
                        {doc.whatToDoNext && (
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">Action Required</h4>
                            <p className="text-sm text-foreground/90 leading-relaxed font-medium">{doc.whatToDoNext}</p>
                          </div>
                        )}
                        {doc.proceduralWarnings && (
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#D4A843] mb-2 flex items-center gap-1.5">
                              <ShieldAlert className="h-3.5 w-3.5" /> Procedural Warnings
                            </h4>
                            <p className="text-sm text-foreground/80 leading-relaxed border-l-2 border-[#D4A843] pl-3 py-0.5">{doc.proceduralWarnings}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </CaseLayout>
  );
}