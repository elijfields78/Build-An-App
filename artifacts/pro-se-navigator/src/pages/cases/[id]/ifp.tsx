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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

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
        <Skeleton className="h-[500px] w-full" />
      </CaseLayout>
    );
  }

  return (
    <CaseLayout caseId={params.id} title="In Forma Pauperis (Fee Waiver)">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6">
              <h3 className="font-serif font-bold text-lg mb-2">Filing Fees</h3>
              <p className="text-sm opacity-90 leading-relaxed mb-4">
                Filing a federal lawsuit costs $400+. If you cannot afford this, you can ask the court to waive the fee by filing an Application to Proceed In Forma Pauperis (IFP).
              </p>
              <ul className="text-sm opacity-90 space-y-2 list-disc list-inside ml-2">
                <li>You must declare all income truthfully under penalty of perjury.</li>
                <li>The judge will review this before allowing your case to proceed.</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-3">
          <Card>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardHeader className="bg-slate-50/50 border-b">
                  <CardTitle className="font-serif text-xl">Financial Declaration</CardTitle>
                  <CardDescription>Fill out your financial details to generate Form AO-239 (Long Form) or AO-240 (Short Form).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="monthlyIncome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Monthly Income ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="monthlyExpenses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Monthly Expenses ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dependents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Dependents</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="totalDebts"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Debts ($)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <FormField
                      control={form.control}
                      name="employed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Are you currently employed?</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receivingBenefits"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-2">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Receiving government benefits?</FormLabel>
                            <p className="text-xs text-slate-500 mt-1">E.g., SSI, SNAP, Medicaid</p>
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
                        <FormLabel>Major Assets</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Cash, bank accounts, real estate, valuable vehicles..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hardshipStatement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Statement of Hardship</FormLabel>
                        <FormControl>
                          <Textarea className="h-24" placeholder="Briefly explain why paying the fee would be an undue hardship..." {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                </CardContent>
                <CardFooter className="bg-slate-50 border-t flex justify-end gap-4 p-4">
                  {data?.generatedText && (
                    <Button type="button" variant="outline">
                      Download AO-239 PDF
                    </Button>
                  )}
                  <Button type="submit" disabled={saveIfp.isPending}>
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
