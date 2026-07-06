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
import { Badge } from "@/components/ui/badge";
import { useForm, Controller } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { Sparkles, Loader2, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";

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
      className="group w-full text-left text-xs px-3 py-2 rounded-md border border-indigo-100 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 hover:border-indigo-300 transition-colors flex items-start gap-2"
    >
      <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-indigo-400 group-hover:text-indigo-600 flex-shrink-0" />
      <span className="leading-snug">{label}</span>
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
    <Card className="border-indigo-200 bg-gradient-to-b from-indigo-50 to-white overflow-hidden">
      <CardHeader className="pb-3 pt-4 px-4 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-indigo-900">AI Suggestions</CardTitle>
            <CardDescription className="text-xs text-indigo-600">Based on your Story Builder</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {loading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-indigo-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analyzing your story…
            </div>
            <Skeleton className="h-10 w-full bg-indigo-100/60" />
            <Skeleton className="h-10 w-full bg-indigo-100/60" />
            <Skeleton className="h-10 w-full bg-indigo-100/60" />
          </div>
        ) : !suggestions?.storyFound ? (
          <div className="flex flex-col items-center text-center gap-2 py-3">
            <BookOpen className="h-8 w-8 text-indigo-200" />
            <p className="text-xs text-indigo-600 font-medium">Complete your Story Builder first</p>
            <p className="text-xs text-slate-500">Once you've told us what happened, AI will suggest the right jurisdiction fields for your case.</p>
          </div>
        ) : (
          <>
            {suggestions.federalOrState && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Court Type</p>
                <SuggestionChip
                  label={`${suggestions.federalOrState.recommendation === "federal" ? "→ Federal Court" : suggestions.federalOrState.recommendation === "state" ? "→ State Court" : "→ Uncertain"} — ${suggestions.federalOrState.reason}`}
                  onApply={() => onApply("federalOrState", suggestions.federalOrState!.recommendation)}
                />
              </div>
            )}

            {suggestions.subjectMatterBasis && suggestions.subjectMatterBasis.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Subject Matter Basis</p>
                <div className="space-y-1.5">
                  {suggestions.subjectMatterBasis.map((s, i) => (
                    <SuggestionChip key={i} label={s} onApply={() => onApply("subjectMatterJurisdiction", s)} />
                  ))}
                </div>
              </div>
            )}

            {suggestions.venue && suggestions.venue.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Venue</p>
                <div className="space-y-1.5">
                  {suggestions.venue.map((s, i) => (
                    <SuggestionChip key={i} label={s} onApply={() => onApply("venue", s)} />
                  ))}
                </div>
              </div>
            )}

            {suggestions.statuteOfLimitations && suggestions.statuteOfLimitations.length > 0 && (
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Statute of Limitations</p>
                <div className="space-y-1.5">
                  {suggestions.statuteOfLimitations.map((s, i) => (
                    <SuggestionChip key={i} label={s} onApply={() => onApply("statuteOfLimitations", s)} />
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-indigo-400 italic border-t border-indigo-100 pt-3">
              Click any suggestion to apply it to the form. Always verify with a licensed attorney.
            </p>
          </>
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
      <Skeleton className="h-[400px] w-full" />
    </CaseLayout>
  );

  return (
    <CaseLayout caseId={params.id} title="Claim & Jurisdiction Analyzer">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="font-serif">Jurisdictional Requirements</CardTitle>
                  <CardDescription>A court must have power over the subject matter and the parties to hear a case.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                  <FormField
                    control={form.control}
                    name="federalOrState"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">Federal or State Court?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
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
                        <FormLabel className="text-base font-bold text-slate-800">Subject Matter Basis</FormLabel>
                        <p className="text-sm text-slate-500 mb-2">Why does this specific court have the right to hear this case? (e.g., "Breach of contract under state law", "Federal Question - Civil Rights Act")</p>
                        <FormControl>
                          <Textarea className="h-24" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="venue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">Venue (Geographic Location)</FormLabel>
                        <p className="text-sm text-slate-500 mb-2">Why are you filing in this specific county or district? (e.g., "Defendant lives here", "The incident occurred here")</p>
                        <FormControl>
                          <Textarea className="h-24" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="statuteOfLimitations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">Statute of Limitations</FormLabel>
                        <p className="text-sm text-slate-500 mb-2">How much time do you have to file this type of claim, and when did the clock start?</p>
                        <FormControl>
                          <Textarea className="h-24" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-slate-50 border-t flex justify-end p-4">
                  <Button type="submit" disabled={saveJurisdiction.isPending}>
                    {saveJurisdiction.isPending ? "Saving..." : "Save Jurisdiction Data"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>

        <div className="space-y-6">
          <SuggestionsPanel caseId={id} onApply={handleApplySuggestion} />

          <Card className="bg-blue-900 text-white border-none">
            <CardContent className="p-6">
              <h3 className="font-bold mb-2">Why this matters</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                If you file in the wrong court, your case can be dismissed immediately, even if you are entirely right on the facts.
              </p>
              <ul className="text-sm opacity-90 space-y-2 list-disc list-inside ml-2">
                <li>Federal courts have strict limits on what they can hear.</li>
                <li>Small claims courts have monetary limits.</li>
                <li>You generally must file where the defendant lives or where the event happened.</li>
              </ul>
            </CardContent>
          </Card>

          {data?.aiAnalysis && (
            <Card className="border-primary/20 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-sm uppercase tracking-wider text-blue-800">AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-900">{data.aiAnalysis}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </CaseLayout>
  );
}
