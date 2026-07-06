import React from "react";
import { useLocation } from "wouter";
import { useCreateCase } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CaseInputCaseType } from "@workspace/api-client-react";

const caseSchema = z.object({
  title: z.string().min(1, "Case title is required"),
  caseType: z.enum(["plaintiff", "defendant", "research"]),
  opposingParty: z.string().optional(),
  summary: z.string().optional(),
});

export default function NewCase() {
  const [, setLocation] = useLocation();
  const createCase = useCreateCase();

  const form = useForm<z.infer<typeof caseSchema>>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      title: "",
      caseType: "plaintiff",
      opposingParty: "",
      summary: "",
    },
  });

  const onSubmit = (data: z.infer<typeof caseSchema>) => {
    createCase.mutate(
      { data: data as any },
      {
        onSuccess: (newCase) => {
          toast.success("Case created successfully");
          setLocation(`/cases/${newCase.id}`);
        },
        onError: () => {
          toast.error("Failed to create case");
        },
      }
    );
  };

  return (
    <AppLayout title="Start a New Case">
      <div className="p-6 max-w-3xl mx-auto w-full">
        <Card className="border-t-4 border-t-primary shadow-md">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Case Profile Initialization</CardTitle>
            <CardDescription>
              Create a new case workspace. This is for your private organization.
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="caseType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold">What is your role in this matter?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-slate-50 cursor-pointer">
                            <RadioGroupItem value="plaintiff" id="r1" />
                            <Label htmlFor="r1" className="flex-1 cursor-pointer">I want to sue someone (Plaintiff)</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-slate-50 cursor-pointer">
                            <RadioGroupItem value="defendant" id="r2" />
                            <Label htmlFor="r2" className="flex-1 cursor-pointer">I am being sued (Defendant)</Label>
                          </div>
                          <div className="flex items-center space-x-2 border rounded-md p-4 hover:bg-slate-50 cursor-pointer">
                            <RadioGroupItem value="research" id="r3" />
                            <Label htmlFor="r3" className="flex-1 cursor-pointer">Research / Fact finding</Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Case Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Smith v. Acme Corp or Dispute with Landlord" {...field} />
                      </FormControl>
                      <p className="text-xs text-slate-500 mt-1">A short, recognizable name for your own reference.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="opposingParty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opposing Party (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person/company" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brief Summary (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A quick 1-2 sentence description of what this case is about..." 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
              </CardContent>
              <CardFooter className="flex justify-end gap-4 border-t bg-slate-50 p-4">
                <Button type="button" variant="outline" onClick={() => setLocation('/dashboard')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCase.isPending}>
                  {createCase.isPending ? "Creating..." : "Initialize Case Workspace"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
}
