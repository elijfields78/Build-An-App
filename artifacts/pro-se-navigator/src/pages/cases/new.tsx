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
        <Card className="border-t-4 border-t-primary shadow-lg shadow-black/5 bg-card/50 backdrop-blur-sm border-x-border/50 border-b-border/50">
          <CardHeader className="bg-muted/10 border-b border-border/50 pb-6">
            <CardTitle className="font-serif text-2xl tracking-tight">Case Profile Initialization</CardTitle>
            <CardDescription className="text-sm mt-1">
              Create a new case workspace. This is for your private organization.
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-8 pt-8">
                
                <FormField
                  control={form.control}
                  name="caseType"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base font-bold text-foreground">What is your role in this matter?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid grid-cols-1 md:grid-cols-3 gap-4"
                        >
                          <div className="flex items-center space-x-3 border border-border/50 rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-colors bg-background/30">
                            <RadioGroupItem value="plaintiff" id="r1" className="data-[state=checked]:border-primary data-[state=checked]:text-primary" />
                            <Label htmlFor="r1" className="flex-1 cursor-pointer font-medium text-sm">I want to sue someone (Plaintiff)</Label>
                          </div>
                          <div className="flex items-center space-x-3 border border-border/50 rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-colors bg-background/30">
                            <RadioGroupItem value="defendant" id="r2" className="data-[state=checked]:border-primary data-[state=checked]:text-primary" />
                            <Label htmlFor="r2" className="flex-1 cursor-pointer font-medium text-sm">I am being sued (Defendant)</Label>
                          </div>
                          <div className="flex items-center space-x-3 border border-border/50 rounded-xl p-4 hover:bg-accent/50 cursor-pointer transition-colors bg-background/30">
                            <RadioGroupItem value="research" id="r3" className="data-[state=checked]:border-primary data-[state=checked]:text-primary" />
                            <Label htmlFor="r3" className="flex-1 cursor-pointer font-medium text-sm">Research / Fact finding</Label>
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
                      <FormLabel className="font-bold text-foreground">Case Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Smith v. Acme Corp or Dispute with Landlord" className="h-11 bg-background/50" {...field} />
                      </FormControl>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mt-1.5">A short, recognizable name for your own reference.</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="opposingParty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Opposing Party (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Name of person/company" className="h-11 bg-background/50" {...field} />
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
                      <FormLabel className="font-bold text-foreground">Brief Summary (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A quick 1-2 sentence description of what this case is about..." 
                          className="resize-none min-h-[100px] bg-background/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
              </CardContent>
              <CardFooter className="flex justify-end gap-4 border-t border-border/50 bg-muted/10 p-6">
                <Button type="button" variant="outline" onClick={() => setLocation('/dashboard')} className="border-border/50 font-bold min-h-10">
                  Cancel
                </Button>
                <Button type="submit" disabled={createCase.isPending} className="font-bold min-h-10 shadow-lg shadow-primary/20 tracking-wide px-6">
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