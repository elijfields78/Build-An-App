import React, { useState } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useListEvidence, useDeleteEvidenceItem, getListEvidenceQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2, FileText, UploadCloud, Eye, Image as ImageIcon, Video, File } from "lucide-react";
import { format } from "date-fns";

export default function CaseEvidence({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { getToken } = useAuth();
  const { data, isLoading } = useListEvidence(id, { query: { enabled: !isNaN(id), queryKey: getListEvidenceQueryKey(id) } });
  const deleteItem = useDeleteEvidenceItem();
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

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
      const res = await fetch(`/api/cases/${id}/evidence`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) throw new Error("Upload failed");
      toast.success("Evidence uploaded successfully");
      qc.invalidateQueries({ queryKey: [`/api/cases/${id}/evidence`] });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error("Failed to upload evidence");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (evidenceId: number) => {
    if (!confirm("Are you sure you want to delete this piece of evidence?")) return;
    deleteItem.mutate({ id, eid: evidenceId }, {
      onSuccess: () => {
        toast.success("Evidence deleted");
        qc.invalidateQueries({ queryKey: [`/api/cases/${id}/evidence`] });
      },
      onError: () => toast.error("Failed to delete evidence")
    });
  };

  const getIconForType = (type: string) => {
    if (type.includes('image')) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (type.includes('video')) return <Video className="h-5 w-5 text-purple-500" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-slate-500" />;
  };

  return (
    <CaseLayout caseId={params.id} title="Evidence Center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg">Upload Evidence</CardTitle>
              <CardDescription>Add documents, photos, or audio relevant to your case.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Select File</Label>
                  <Input id="file" name="file" type="file" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input id="description" name="description" placeholder="Brief note about this file" />
                </div>
                <Button type="submit" disabled={isUploading} className="w-full">
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Evidence"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-blue-900 text-white border-none">
            <CardContent className="p-6">
              <h3 className="font-bold mb-2">Evidence Tips</h3>
              <ul className="text-sm opacity-90 space-y-2 list-disc list-inside ml-2">
                <li>Upload primary sources (contracts, emails, photos)</li>
                <li>Label everything clearly</li>
                <li>Our AI will attempt to extract key dates and facts from documents automatically.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : data?.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50">
              <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">No Evidence Found</h3>
                <p className="text-slate-500">Upload your first piece of evidence using the panel.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data?.map(item => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/40 transition-colors">
                  <div className="flex">
                    <div className="bg-slate-100 p-4 flex items-center justify-center border-r">
                      {getIconForType(item.fileType)}
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900">{item.fileName}</h4>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{format(new Date(item.uploadedAt), 'PPp')}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm mt-3 text-slate-700">{item.description}</p>
                      )}

                      {item.aiSummary && (
                        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-md p-3">
                          <h5 className="text-xs font-bold text-blue-900 mb-1 uppercase tracking-wider">AI Analysis</h5>
                          <p className="text-sm text-blue-800">{item.aiSummary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </CaseLayout>
  );
}
