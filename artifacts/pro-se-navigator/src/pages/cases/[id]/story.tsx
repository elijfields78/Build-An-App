import React, { useEffect, useRef } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetCaseStory, useSaveCaseStory, getGetCaseStoryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
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
        <Skeleton className="h-[600px] w-full" />
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="Case Story Builder">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20">
            <CardContent className="p-6">
              <h3 className="font-serif font-bold text-xl mb-3 tracking-tight">Why build a story?</h3>
              <p className="text-sm text-primary-foreground/90 leading-relaxed mb-5">
                Courts run on facts, not emotion. This questionnaire breaks down your grievance into the structured factual elements a judge needs to evaluate your claim.
              </p>
              <ul className="text-sm text-primary-foreground/80 space-y-2 list-none">
                <li className="flex gap-2 items-start"><span className="text-primary-foreground/50">—</span> Be specific and concise</li>
                <li className="flex gap-2 items-start"><span className="text-primary-foreground/50">—</span> Avoid exaggerated language</li>
                <li className="flex gap-2 items-start"><span className="text-primary-foreground/50">—</span> Stick to what you can prove</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="border-b border-border/50 bg-muted/20">
                  <CardTitle className="font-serif text-2xl">The Core Facts</CardTitle>
                  <CardDescription className="text-sm">Detail exactly what occurred without legal jargon.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  
                  <FormField
                    control={form.control}
                    name="whoHarmedYou"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">1. Who harmed you?</FormLabel>
                        <FormDescription className="text-xs">List the specific individuals, companies, or agencies involved.</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[100px] bg-background/50 focus:bg-background" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="whatHappened"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">2. What happened?</FormLabel>
                        <FormDescription className="text-xs">Tell the story in chronological order. What actions did they take?</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[150px] bg-background/50 focus:bg-background" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="whenHappened"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground">3. When did this happen?</FormLabel>
                          <FormDescription className="text-xs">Specific dates or date ranges.</FormDescription>
                          <FormControl>
                            <Textarea className="min-h-[100px] bg-background/50 focus:bg-background font-mono text-sm" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="whereHappened"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground">4. Where did this happen?</FormLabel>
                          <FormDescription className="text-xs">Locations, addresses, or online platforms.</FormDescription>
                          <FormControl>
                            <Textarea className="min-h-[100px] bg-background/50 focus:bg-background" {...field} />
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
                        <FormLabel className="text-base font-bold text-foreground">5. How were you harmed? (Damages)</FormLabel>
                        <FormDescription className="text-xs">Financial losses, physical injuries, or other specific harm.</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[100px] bg-background/50 focus:bg-background" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="desiredOutcome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">6. What do you want the court to do? (Relief)</FormLabel>
                        <FormDescription className="text-xs">Money, an injunction to stop behavior, return of property, etc.</FormDescription>
                        <FormControl>
                          <Textarea className="min-h-[100px] bg-background/50 focus:bg-background" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/50 flex justify-end p-6">
                  <Button type="submit" disabled={saveStory.isPending} className="px-8 min-h-10 text-sm font-bold tracking-wide shadow-lg shadow-primary/20">
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