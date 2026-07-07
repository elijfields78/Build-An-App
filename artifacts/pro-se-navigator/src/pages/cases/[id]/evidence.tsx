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
import { Trash2, FileText, UploadCloud, Image as ImageIcon, Video, File, Sparkles, CheckCircle2, ShieldCheck, Link2 } from "lucide-react";
import { format } from "date-fns";

export default function CaseEvidence({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { getToken } = useAuth();
  const { data, isLoading } = useListEvidence(id, { query: { enabled: !isNaN(id), queryKey: getListEvidenceQueryKey(id) } });
  const deleteItem = useDeleteEvidenceItem();
  const qc = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [proofChecks, setProofChecks] = useState<Record<string, boolean>>({});

  const proofMap = [
    "Fact supported by a document or witness",
    "Date and timeline connection identified",
    "Claim element supported by evidence",
    "Damages or harm proof identified",
    "Exhibit label / description ready",
    "Source authenticity or origin noted",
  ];

  const proofReady = proofMap.filter((item) => proofChecks[item]).length;

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
    if (type.includes('image')) return <ImageIcon className="h-6 w-6 text-primary" />;
    if (type.includes('video')) return <Video className="h-6 w-6 text-accent" />;
    if (type.includes('pdf')) return <FileText className="h-6 w-6 text-destructive" />;
    return <File className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <CaseLayout caseId={params.id} title="Evidence Center">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <CardHeader className="bg-muted/10 border-b border-border/50">
              <CardTitle className="text-lg font-serif">Upload Evidence</CardTitle>
              <CardDescription className="text-xs">Add documents, photos, or audio relevant to your case.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpload} className="space-y-5">
                <div className="space-y-2.5">
                  <Label htmlFor="file" className="text-sm font-bold text-foreground">Select File</Label>
                  <Input id="file" name="file" type="file" required className="bg-background/50 file:text-foreground file:font-medium" />
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="description" className="text-sm font-bold text-foreground">Description (Optional)</Label>
                  <Input id="description" name="description" placeholder="Brief note about this file" className="bg-background/50" />
                </div>
                <Button type="submit" disabled={isUploading} className="w-full shadow-md">
                  <UploadCloud className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Evidence"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-secondary/30 border-none relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <FileText className="w-24 h-24 text-secondary-foreground" />
            </div>
            <CardContent className="p-6 relative z-10">
              <h3 className="font-serif font-bold text-lg mb-3 tracking-tight">Evidence Tips</h3>
              <ul className="text-sm text-foreground/80 space-y-2 list-none">
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Upload primary sources (contracts, emails, photos)</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Label everything clearly</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Our AI will attempt to extract key dates and facts from documents automatically.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif flex items-center gap-2 text-lg">
                <ShieldCheck className="h-5 w-5 text-primary" /> Exhibit Readiness
              </CardTitle>
              <CardDescription>{proofReady} / {proofMap.length} proof-mapping issues reviewed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {proofMap.map((item) => (
                <label key={item} className="flex items-start gap-3 rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!proofChecks[item]}
                    onChange={() => setProofChecks((current) => ({ ...current, [item]: !current[item] }))}
                    className="mt-1"
                  />
                  <span className={proofChecks[item] ? "text-muted-foreground line-through" : "text-foreground"}>{item}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <Card className="border-[#D4A843]/30 bg-[#D4A843]/5">
            <CardContent className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Evidence items</div>
                <div className="mt-1 text-3xl font-mono font-bold text-[#D4A843]">{data?.length ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Exhibit readiness</div>
                <div className="mt-1 text-3xl font-mono font-bold text-primary">{proofReady}/{proofMap.length}</div>
              </div>
              <div className="text-sm text-muted-foreground leading-6 flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary shrink-0" /> Map every fact to evidence before drafting, discovery, summary judgment, or settlement packages.
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : data?.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted/30 rounded-full mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground opacity-50" />
                </div>
                <h3 className="text-xl font-serif font-bold text-foreground mb-1">No Evidence Found</h3>
                <p className="text-sm text-muted-foreground">Upload your first piece of evidence using the panel.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data?.map(item => (
                <Card key={item.id} className="overflow-hidden hover:border-primary/50 transition-colors group bg-card/50 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row">
                    <div className="bg-muted/10 p-6 flex items-center justify-center sm:border-r border-b sm:border-b-0 border-border/50">
                      <div className="p-3 bg-background rounded-xl shadow-sm">
                        {getIconForType(item.fileType)}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-serif font-bold text-lg text-foreground line-clamp-1">{item.fileName}</h4>
                          <div className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wider flex items-center gap-2">
                            <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{format(new Date(item.uploadedAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-foreground/80 mt-2">{item.description}</p>
                      )}

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                        {["Fact support", "Timeline link", "Exhibit candidate"].map((tag) => (
                          <div key={tag} className="rounded-md border border-border/60 bg-background/50 px-3 py-2 flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {tag}
                          </div>
                        ))}
                      </div>

                      {item.aiSummary && (
                        <div className="mt-4 bg-primary/5 border border-primary/10 rounded-lg p-3.5">
                          <h5 className="text-[10px] font-bold text-primary mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" /> AI Analysis
                          </h5>
                          <p className="text-sm text-foreground/80 leading-relaxed">{item.aiSummary}</p>
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