import React, { useEffect, useRef } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetCaseStory, useSaveCaseStory, getGetCaseStoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Save } from "lucide-react";

export default function CaseStoryBuilder({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data, isLoading } = useGetCaseStory(id, { query: { enabled: !isNaN(id), queryKey: getGetCaseStoryQueryKey(id) } });
  const saveStory = useSaveCaseStory();

  const form = useForm({
    defaultValues: {
      whoHarmedYou: "",
      whatHappened: "",
      whenHappened: "",
      whereHappened: "",
      evidenceDescription: "",
      rightsViolated: "",
      damagesSuffered: "",
      desiredOutcome: "",
    }
  });

  const initRef = useRef<number | null>(null);

  useEffect(() => {
    if (data && initRef.current !== id) {
      initRef.current = id;
      form.reset({
        whoHarmedYou: data.whoHarmedYou || "",
        whatHappened: data.whatHappened || "",
        whenHappened: data.whenHappened || "",
        whereHappened: data.whereHappened || "",
        evidenceDescription: data.evidenceDescription || "",
        rightsViolated: data.rightsViolated || "",
        damagesSuffered: data.damagesSuffered || "",
        desiredOutcome: data.desiredOutcome || "",
      });
    }
  }, [data, id, form]);

  const onSubmit = (values: any) => {
    saveStory.mutate(
      { id, data: values },
      {
        onSuccess: () => {
          toast.success("Case story saved successfully");
        },
        onError: () => {
          toast.error("Failed to save case story");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <CaseLayout caseId={params.id} title="Loading Story Builder...">
        <Skeleton className="h-96 w-full" />
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="Case Story Builder">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6">
              <h3 className="font-serif font-bold text-lg mb-2">Why build a story?</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Courts run on facts, not emotion. This questionnaire breaks down your grievance into the structured factual elements a judge needs to evaluate your claim.
              </p>
              <ul className="text-sm opacity-90 space-y-2 list-disc list-inside ml-2">
                <li>Be specific and concise</li>
                <li>Avoid exaggerated language</li>
                <li>Stick to what you can prove</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="border-b bg-slate-50/50">
                  <CardTitle className="font-serif text-xl">The Core Facts</CardTitle>
                  <CardDescription>Detail exactly what occurred without legal jargon.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  
                  <FormField
                    control={form.control}
                    name="whoHarmedYou"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">1. Who harmed you?</FormLabel>
                        <FormDescription>List the specific individuals, companies, or agencies involved.</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatHappened"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">2. What happened?</FormLabel>
                        <FormDescription>Tell the story in chronological order. What actions did they take?</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[150px]" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="whenHappened"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-slate-800">3. When did this happen?</FormLabel>
                          <FormDescription>Specific dates or date ranges.</FormDescription>
                          <FormControl>
                            <Textarea className="min-h-[100px]" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whereHappened"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-slate-800">4. Where did this happen?</FormLabel>
                          <FormDescription>Locations, addresses, or online platforms.</FormDescription>
                          <FormControl>
                            <Textarea className="min-h-[100px]" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="damagesSuffered"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">5. How were you harmed? (Damages)</FormLabel>
                        <FormDescription>Financial losses, physical injuries, or other specific harm.</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="desiredOutcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-slate-800">6. What do you want the court to do? (Relief)</FormLabel>
                        <FormDescription>Money, an injunction to stop behavior, return of property, etc.</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[100px]" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-slate-50 border-t flex justify-end p-4">
                  <Button type="submit" disabled={saveStory.isPending} className="px-6">
                    <Save className="w-4 h-4 mr-2" />
                    {saveStory.isPending ? "Saving..." : "Save Story"}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </div>
      </div>
    </CaseLayout>
  );
}
