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
import { Trash2, FileText, UploadCloud, ShieldAlert, FileWarning, Clock, Zap } from "lucide-react";
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Scan Document</CardTitle>
              <CardDescription>Upload motions, orders, or notices you received from the court or opposing counsel.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {tier === "free" && scanUsage && (
                <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span>Free tier usage</span>
                    <span>{scanUsage.used}/{scanUsage.limit} scans</span>
                  </div>
                  <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (scanUsage.used / scanUsage.limit) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {atLimit ? (
                <div className="text-center py-4">
                  <p className="text-sm text-slate-700 font-semibold mb-1">Monthly scan limit reached</p>
                  <p className="text-xs text-slate-500 mb-3">Upgrade for unlimited court document scanning.</p>
                  <Button size="sm" onClick={() => setUpgradeOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white">
                    <Zap className="h-3.5 w-3.5 mr-1.5" /> Upgrade to Advocate
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpload} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="file">Select PDF or Image</Label>
                    <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" required />
                  </div>
                  <Button type="submit" disabled={isUploading} className="w-full">
                    <UploadCloud className="h-4 w-4 mr-2" />
                    {isUploading ? "Scanning..." : "Upload & Analyze"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200 text-red-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 font-bold mb-2 text-red-800">
                <ShieldAlert className="h-5 w-5" />
                Deadlines Matter
              </div>
              <p className="text-sm opacity-90 leading-relaxed">
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
            <Card className="border-dashed border-2 bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileWarning className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Documents Uploaded</h3>
                <p className="text-slate-500">Upload documents you receive to get AI translation and deadline extraction.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {data?.map(doc => (
                <Card key={doc.id} className="overflow-hidden shadow-sm">
                  <CardHeader className="bg-slate-50 border-b pb-3 pt-4 px-5 flex flex-row items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-primary" />
                        <CardTitle className="text-base">{doc.fileName}</CardTitle>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span className="uppercase font-semibold text-primary">{doc.documentType || 'Unknown Type'}</span>
                        <span>•</span>
                        <span>{format(new Date(doc.uploadedAt), 'PPp')}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 -mt-1 -mr-1">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                      <div className="p-5 space-y-4">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Plain English Summary</h4>
                          <p className="text-sm text-slate-800 leading-relaxed">{doc.plainEnglishSummary || 'Analysis pending...'}</p>
                        </div>
                        {doc.whatItMeans && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">What It Means</h4>
                            <p className="text-sm text-slate-800 leading-relaxed">{doc.whatItMeans}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-5 space-y-4 bg-slate-50/50">
                        {doc.deadlinesIdentified && (
                          <div className="bg-red-50 border border-red-100 rounded-md p-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-1 flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Identified Deadlines
                            </h4>
                            <p className="text-sm text-red-900 font-medium">{doc.deadlinesIdentified}</p>
                          </div>
                        )}
                        {doc.whatToDoNext && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Action Required</h4>
                            <p className="text-sm text-slate-800 leading-relaxed">{doc.whatToDoNext}</p>
                          </div>
                        )}
                        {doc.proceduralWarnings && (
                          <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1 flex items-center gap-1">
                              <ShieldAlert className="h-3 w-3" /> Procedural Warnings
                            </h4>
                            <p className="text-sm text-orange-800 leading-relaxed">{doc.proceduralWarnings}</p>
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
