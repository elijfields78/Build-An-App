import React, { useEffect, useRef } from "react";
import { CaseLayout } from "@/components/layout/CaseLayout";
import { useGetIfpApplication, useSaveIfpApplication, getGetIfpApplicationQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { toast } from "sonner";
import { Download, Save, Scale } from "lucide-react";

export default function CaseIfp({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data, isLoading } = useGetIfpApplication(id, { query: { enabled: !isNaN(id), queryKey: getGetIfpApplicationQueryKey(id) } });
  const saveIfp = useSaveIfpApplication();

  const form = useForm({
    defaultValues: {
      formType: "AO239",
      monthlyIncome: 0,
      monthlyExpenses: 0,
      assets: "",
      dependents: 0,
      employed: false,
      employer: "",
      receivingBenefits: false,
      benefitsDescription: "",
      totalDebts: 0,
      hardshipStatement: "",
    }
  });

  const initRef = useRef<number | null>(null);

  useEffect(() => {
    if (data && initRef.current !== id) {
      initRef.current = id;
      form.reset({
        formType: data.formType || "AO239",
        monthlyIncome: data.monthlyIncome || 0,
        monthlyExpenses: data.monthlyExpenses || 0,
        assets: data.assets || "",
        dependents: data.dependents || 0,
        employed: data.employed || false,
        employer: data.employer || "",
        receivingBenefits: data.receivingBenefits || false,
        benefitsDescription: data.benefitsDescription || "",
        totalDebts: data.totalDebts || 0,
        hardshipStatement: data.hardshipStatement || "",
      });
    }
  }, [data, id, form]);

  const onSubmit = (values: any) => {
    // Coerce numeric values
    const dataToSave = {
      ...values,
      monthlyIncome: Number(values.monthlyIncome),
      monthlyExpenses: Number(values.monthlyExpenses),
      dependents: Number(values.dependents),
      totalDebts: Number(values.totalDebts),
    };
    
    saveIfp.mutate({ id, data: dataToSave }, {
      onSuccess: () => toast.success("IFP Application data saved"),
      onError: () => toast.error("Failed to save IFP data")
    });
  };

  if (isLoading) {
    return (
      <CaseLayout caseId={params.id} title="Fee Waiver (IFP)">
        <Skeleton className="h-[600px] w-full" />
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="In Forma Pauperis (Fee Waiver)">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-primary text-primary-foreground border-none shadow-lg shadow-primary/20">
            <CardContent className="p-6">
              <Scale className="h-8 w-8 mb-4 opacity-80" />
              <h3 className="font-serif font-bold text-xl mb-3 tracking-tight">Filing Fees</h3>
              <p className="text-sm text-primary-foreground/90 leading-relaxed mb-5">
                Filing a federal lawsuit costs $400+. If you cannot afford this, you can ask the court to waive the fee by filing an Application to Proceed In Forma Pauperis (IFP).
              </p>
              <ul className="text-sm text-primary-foreground/80 space-y-3 list-none border-t border-primary-foreground/20 pt-5">
                <li className="flex gap-2 items-start"><span className="text-primary-foreground/50 font-bold">1.</span> Declare all income truthfully under penalty of perjury.</li>
                <li className="flex gap-2 items-start"><span className="text-primary-foreground/50 font-bold">2.</span> The judge will review this before allowing your case to proceed.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-3">
          <Card className="bg-card/50 backdrop-blur-sm border-border/50">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="bg-muted/10 border-b border-border/50">
                  <CardTitle className="font-serif text-2xl">Financial Declaration</CardTitle>
                  <CardDescription className="text-sm">Fill out your financial details to generate Form AO-239 (Long Form) or AO-240 (Short Form).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground">Total Monthly Income ($)</FormLabel>
                          <FormControl>
                            <Input type="number" className="h-11 bg-background/50 font-mono text-base" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground">Total Monthly Expenses ($)</FormLabel>
                          <FormControl>
                            <Input type="number" className="h-11 bg-background/50 font-mono text-base" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dependents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground">Number of Dependents</FormLabel>
                          <FormControl>
                            <Input type="number" className="h-11 bg-background/50 font-mono text-base" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalDebts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-base font-bold text-foreground">Total Debts ($)</FormLabel>
                          <FormControl>
                            <Input type="number" className="h-11 bg-background/50 font-mono text-base" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-border/50">
                    <FormField
                      control={form.control}
                      name="employed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 border border-border/50 rounded-xl bg-background/30">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                          </FormControl>
                          <div className="space-y-1.5 leading-none">
                            <FormLabel className="text-base font-bold text-foreground cursor-pointer">Currently employed?</FormLabel>
                            <p className="text-sm text-muted-foreground">Check if you receive wages.</p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receivingBenefits"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-4 space-y-0 p-4 border border-border/50 rounded-xl bg-background/30">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-1" />
                          </FormControl>
                          <div className="space-y-1.5 leading-none">
                            <FormLabel className="text-base font-bold text-foreground cursor-pointer">Receiving government benefits?</FormLabel>
                            <p className="text-sm text-muted-foreground">E.g., SSI, SNAP, Medicaid</p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="assets"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">Major Assets</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[100px] bg-background/50" placeholder="Cash, bank accounts, real estate, valuable vehicles..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hardshipStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-bold text-foreground">Statement of Hardship</FormLabel>
                        <FormControl>
                          <Textarea className="min-h-[120px] bg-background/50" placeholder="Briefly explain why paying the fee would be an undue hardship..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-muted/10 border-t border-border/50 flex justify-end gap-4 p-6">
                  {data?.generatedText && (
                    <Button type="button" variant="outline" className="min-h-10 font-bold border-primary/30 text-primary hover:bg-primary/10">
                      <Download className="w-4 h-4 mr-2" />
                      Download AO-239
                    </Button>
                  )}
                  <Button type="submit" disabled={saveIfp.isPending} className="px-8 min-h-10 font-bold shadow-lg shadow-primary/20">
                    <Save className="w-4 h-4 mr-2" />
                    {saveIfp.isPending ? "Saving..." : "Save Financial Data"}
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