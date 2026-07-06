import React, { useState, useEffect, useRef } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetJurisdictionAnalysis, useSaveJurisdictionAnalysis, getGetJurisdictionAnalysisQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";
import { Sparkles, Loader2, BookOpen, CheckCircle2 } from "lucide-react";

type JurisdictionSuggestions = {
  storyFound: boolean;
  federalOrState?: { recommendation: string; reason: string };
  subjectMatterBasis?: string[];
  venue?: string[];
  statuteOfLimitations?: string[];
};

function SuggestionChip({ label, onApply }: { label: string; onApply: () => void }) {
  return (
    <button
      type="button"
      onClick={onApply}
      className="group w-full text-left text-xs px-3.5 py-2.5 rounded-lg border border-primary/20 bg-primary/5 text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors flex items-start gap-2.5 shadow-sm"
    >
      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary/60 group-hover:text-primary flex-shrink-0 transition-colors" />
      <span className="leading-relaxed font-medium">{label}</span>
    </button>
  );
}

function SuggestionsPanel({
  caseId,
  onApply,
}: {
  caseId: number;
  onApply: (field: string, value: string) => void;
}) {
  const { getToken } = useAuth();
  const [suggestions, setSuggestions] = useState<JurisdictionSuggestions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isNaN(caseId)) return;
    const fetchSuggestions = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`/api/cases/${caseId}/jurisdiction/suggestions`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) setSuggestions(await res.json());
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, [caseId]);

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur-md overflow-hidden relative shadow-lg shadow-primary/5">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />
      <CardHeader className="pb-3 pt-5 px-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-serif font-bold text-foreground">AI Suggestions</CardTitle>
            <CardDescription className="text-[10px] uppercase font-bold tracking-wider text-primary/80 mt-0.5">Based on your Story</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {loading ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-medium text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing your story…
            </div>
            <Skeleton className="h-12 w-full bg-primary/10" />
            <Skeleton className="h-12 w-full bg-primary/10" />
          </div>
        ) : !suggestions?.storyFound ? (
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <div className="p-4 bg-muted/30 rounded-full">
              <BookOpen className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <p className="text-sm text-foreground font-bold font-serif">Complete Story Builder First</p>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[250px]">Once you've told us what happened, AI will suggest the right jurisdiction fields for your case.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {suggestions.federalOrState && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Court Type</p>
                <SuggestionChip
                  label={`${suggestions.federalOrState.recommendation === "federal" ? "Federal Court" : suggestions.federalOrState.recommendation === "state" ? "State Court" : "Uncertain"} — ${suggestions.federalOrState.reason}`}
                  onApply={() => onApply("federalOrState", suggestions.federalOrState!.recommendation)}
                />
              </div>
            )}

            {suggestions.subjectMatterBasis && suggestions.subjectMatterBasis.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Subject Matter Basis</p>
                <div className="space-y-2">
                  {suggestions.subjectMatterBasis.map((s, i) => (
                    <SuggestionChip key={i} label={s} onApply={() => onApply("subjectMatterJurisdiction", s)} />
                  ))}
                </div>
              </div>
            )}

            {suggestions.venue && suggestions.venue.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Venue</p>
                <div className="space-y-2">
                  {suggestions.venue.map((s, i) => (
                    <SuggestionChip key={i} label={s} onApply={() => onApply("venue", s)} />
                  ))}
                </div>
              </div>
            )}

            {suggestions.statuteOfLimitations && suggestions.statuteOfLimitations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Statute of Limitations</p>
                <div className="space-y-2">
                  {suggestions.statuteOfLimitations.map((s, i) => (
                    <SuggestionChip key={i} label={s} onApply={() => onApply("statuteOfLimitations", s)} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic border-t border-border/50 pt-4 mt-2">
              Click any suggestion to apply it to the form. Always verify with a licensed attorney.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CaseJurisdiction({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data, isLoading } = useGetJurisdictionAnalysis(id, { query: { enabled: !isNaN(id), queryKey: getGetJurisdictionAnalysisQueryKey(id) } });
  const saveJurisdiction = useSaveJurisdictionAnalysis();

  const form = useForm({
    defaultValues: {
      federalOrState: "",
      subjectMatterJurisdiction: "",
      statuteOfLimitations: "",
      venue: "",
    }
  });

  const initRef = useRef<number | null>(null);

  useEffect(() => {
    if (data && initRef.current !== id) {
      initRef.current = id;
      form.reset({
        federalOrState: data.federalOrState || "",
        subjectMatterJurisdiction: data.subjectMatterJurisdiction || "",
        statuteOfLimitations: data.statuteOfLimitations || "",
        venue: data.venue || "",
      });
    }
  }, [data, id, form]);

  const handleApplySuggestion = (field: string, value: string) => {
    form.setValue(field as any, value, { shouldDirty: true });
    toast.success("Suggestion applied — review and save when ready.");
  };

  const onSubmit = (values: any) => {
    saveJurisdiction.mutate({ id, data: values }, {
      onSuccess: () => toast.success("Jurisdiction info saved"),
      onError: () => toast.error("Failed to save")
    });
  };

  if (isLoading) return (
    <CaseLayout caseId={params.id} title="Jurisdiction Analysis">
      <Skeleton className="h-[600px] w-full" />
    </CaseLayout>
  );

  return (
    <CaseLayout caseId={params.id} title="Claim & Jurisdiction Analyzer">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="bg-muted/10 border-b border-border/50">
                  <CardTitle className="font-serif text-2xl">Jurisdictional Requirements</CardTitle>
                  <CardDescription className="text-sm">A court must have power over the subject matter and the parties to hear a case.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">

                  <FormField
                    control={form.control}
                    name="federalOrState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">Federal or State Court?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background/50 h-11">
                              <SelectValue placeholder="Select court system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="state">State Court (most common)</SelectItem>
                            <SelectItem value="federal">Federal Court</SelectItem>
                            <SelectItem value="unsure">I'm not sure yet</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subjectMatterJurisdiction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">Subject Matter Basis</FormLabel>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Why does this specific court have the right to hear this case? (e.g., "Breach of contract under state law", "Federal Question - Civil Rights Act")</p>
                        <FormControl>
                          <Textarea className="h-28 bg-background/50" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">Venue (Geographic Location)</FormLabel>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Why are you filing in this specific county or district? (e.g., "Defendant lives here", "The incident occurred here")</p>
                        <FormControl>
                          <Textarea className="h-28 bg-background/50" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="statuteOfLimitations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">Statute of Limitations</FormLabel>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">How much time do you have to file this type of claim, and when did the clock start?</p>
                        <FormControl>
                          <Textarea className="h-28 bg-background/50" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/50 flex justify-end p-6">
                  <Button type="submit" disabled={saveJurisdiction.isPending} className="px-8 min-h-10 font-bold shadow-lg">
                    {saveJurisdiction.isPending ? "Saving..." : "Save Jurisdiction Data"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="space-y-6">
          <SuggestionsPanel caseId={id} onApply={handleApplySuggestion} />

          <Card className="bg-secondary/30 border-none">
            <CardContent className="p-6">
              <h3 className="font-serif font-bold text-lg mb-3 tracking-tight">Why this matters</h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                If you file in the wrong court, your case can be dismissed immediately, even if you are entirely right on the facts.
              </p>
              <ul className="text-sm text-foreground/80 space-y-2 list-none">
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Federal courts have strict limits</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Small claims have monetary caps</li>
                <li className="flex gap-2 items-start"><span className="text-muted-foreground">—</span> Must file where defendant lives or event occurred</li>
              </ul>
            </CardContent>
          </Card>

          {data?.aiAnalysis && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" /> AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/90 leading-relaxed">{data.aiAnalysis}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CaseLayout>
  );
}