import React from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetJurisdictionAnalysis, useSaveJurisdictionAnalysis, getGetJurisdictionAnalysisQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm, Controller } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

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
