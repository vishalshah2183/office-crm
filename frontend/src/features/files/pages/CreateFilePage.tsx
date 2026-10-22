import React from 'react';
import { Formik, Form, Field } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FileText, User, Building, Send, CircleDollarSign, CreditCard } from 'lucide-react';
import { fileApi, CreateFilePayload } from '../../../services/fileApi';
import { fileSchema } from '../validation/fileSchema';
import { useToast } from '../../../components/feedback/ToastContext';
import { FormField } from '../../../components/forms/FormField';
import { FormDatePicker } from '../../../components/forms/FormDatePicker';
import { FormSelect } from '../../../components/forms/FormSelect';
import { FormTextarea } from '../../../components/forms/FormTextarea';
import { FormMultiSelect } from '../../../components/forms/FormMultiSelect';
import { SubmitButton } from '../../../components/forms/SubmitButton';

export const CreateFilePage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const workTypeOptions = [
    { value: 'Building Permission', label: 'Building Permission' },
    { value: 'Estimate', label: 'Estimate' },
    { value: 'Valuation', label: 'Valuation' },
    { value: 'Design', label: 'Design' },
  ];

  const permissionTypeOptions = [
    { value: 'Building Permission', label: 'New Building Permission' },
    { value: 'Addition & Extension', label: 'Addition & Extension' },
    { value: 'Subdivision', label: 'Subdivision' },
    { value: 'Layout', label: 'Layout' },
  ];

  const floorOptions = [
    { value: 'Ground', label: 'Ground' },
    { value: 'First', label: 'First' },
    { value: 'Second', label: 'Second' },
    { value: 'Third', label: 'Third' },
    { value: 'Fourth', label: 'Fourth' },
    { value: 'Fifth', label: 'Fifth' },
    { value: 'More', label: 'More' },
  ];

  const initialValues: CreateFilePayload = {
    file_number: `FILE-${Math.floor(Math.random() * 9000 + 1000)}`,
    odps_number: '',
    work_type: 'Building Permission',
    applicant_name: '',
    applicant_address: '',
    applicant_mobile: '',
    revenue_survey_no: '',
    city_survey_no: '',
    tp_scheme_no: '',
    final_plot_no: '',
    plot_no: '',
    permission_type: 'Building Permission',
    floors: '',
    specific_built_up_area: '' as any,
    estimated_amount: '' as any,
    advance_payment_enabled: false,
    advance_amount: '' as any,
    advance_payment_date: new Date().toISOString().split('T')[0],
    advance_payment_method: 'UPI',
    advance_reference_number: '',
    advance_notes: '',
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/files"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-100">Register New Project File</h1>
            <p className="text-xs text-slate-400">
              Create an official project file record for drawing, layout, or permission workflow.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <Formik
        initialValues={initialValues}
        validationSchema={fileSchema}
        onSubmit={async (values, { setSubmitting, setFieldError }) => {
          try {
            const hasQuotation = Boolean(values.estimated_amount && Number(values.estimated_amount) > 0);
            const payload: CreateFilePayload = {
              ...values,
              permission_type: values.work_type === 'Building Permission' ? values.permission_type : undefined,
              specific_built_up_area: values.specific_built_up_area
                ? Number(values.specific_built_up_area)
                : undefined,
              estimated_amount: values.estimated_amount
                ? Number(values.estimated_amount)
                : undefined,
              advance_payment: (hasQuotation && values.advance_payment_enabled)
                ? {
                  amount: Number(values.advance_amount),
                  payment_date: values.advance_payment_date || '',
                  payment_method: values.advance_payment_method || '',
                  reference_number: values.advance_reference_number || undefined,
                  notes: values.advance_notes || undefined,
                }
                : undefined,
            };

            const res = await fileApi.createFile(payload);
            if (res.data?.file?.id) {
              toast.success('File Registered', `Project file ${res.data.file.file_number || ''} created successfully.`);
              await queryClient.invalidateQueries({ queryKey: ['files'] });
              await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
              navigate(`/files/${res.data.file.id}`);
            } else {
              toast.success('File Registered', 'Project file created successfully.');
              navigate('/files');
            }
          } catch (error: any) {
            const resData = error.response?.data;
            if (resData?.errors) {
              Object.entries(resData.errors).forEach(([field, msg]) => {
                setFieldError(field, Array.isArray(msg) ? msg[0] : (msg as string));
              });
            }
            toast.error('Registration Failed', resData?.message || 'Failed to create file');
          } finally {
            setSubmitting(false);
          }
        }}
      >
        {({ values, setFieldValue }) => {
          const hasQuotation = Boolean(values.estimated_amount && Number(values.estimated_amount) > 0);

          return (
            <Form className="space-y-6">
              {/* Section 1: File Classification */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  1. File Classification & Category
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField name="file_number" label="File Number" placeholder="e.g. FILE-1001" required />
                  <FormField name="odps_number" label="ODPS Number" placeholder="e.g. ODPS-2026-X" />
                  <FormSelect name="work_type" label="Work Category" options={workTypeOptions} required />
                </div>

                {values.work_type === 'Building Permission' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormSelect
                      name="permission_type"
                      label="Permission Sub-type"
                      options={permissionTypeOptions}
                      required
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Applicant Information */}
              <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <User className="w-4 h-4 text-cyan-400" />
                  2. Applicant & Contact Details
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField name="applicant_name" label="Applicant Name" placeholder="Full name of client" required />
                  <FormField name="applicant_mobile" label="Mobile Number" placeholder="10-digit mobile" required />
                </div>

                <FormTextarea
                  name="applicant_address"
                  label="Applicant Address"
                  placeholder="Street name, landmark, village/city..."
                  rows={2}
                />
              </div>

              {/* Section 3: Property Information */}
              {values.work_type === 'Building Permission' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 text-cyan-400 font-semibold text-sm">
                    <Building className="w-4 h-4" />
                    <h2>3. Property Survey & Architectural Parameters</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField name="revenue_survey_no" label="Revenue Survey No" placeholder="RS-45" />
                    <FormField name="city_survey_no" label="City Survey No" placeholder="CS-102" />
                    <FormField name="tp_scheme_no" label="TP Scheme No" placeholder="TP-04" />
                    <FormField name="final_plot_no" label="Final Plot No" placeholder="FP-12" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="plot_no" label="Plot Number" placeholder="Plot 15" />
                    <FormField
                      name="specific_built_up_area"
                      label="Built-Up Area (sq.ft)"
                      type="number"
                      placeholder="2400.50"
                      step="0.01"
                    />
                  </div>

                  <FormMultiSelect
                    name="floors"
                    label="Proposed Floors"
                    options={floorOptions}
                    helperText="Select all applicable proposed floors for this property"
                  />
                </div>
              )}

              {/* Section 4: Quotation */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 text-cyan-400 font-semibold text-sm">
                  <CircleDollarSign className="w-4 h-4" />
                  <h2>4. Quotation</h2>
                </div>

                <FormField
                  name="estimated_amount"
                  label="Estimation Amount Given to Client (₹)"
                  type="number"
                  placeholder="50000"
                  step="0.01"
                />
              </div>

              {/* Section 5: Optional Advance Payment */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3 text-cyan-400 font-semibold text-sm">
                  <CreditCard className="w-4 h-4" />
                  <h2>5. Advance Payment (Optional)</h2>
                </div>

                {/* Enhanced Interactive Toggle Card */}
                <div
                  className={`p-4 rounded-xl border transition-all ${
                    !hasQuotation
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-70'
                      : values.advance_payment_enabled
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <label
                    htmlFor="advance_payment_enabled"
                    className={`flex items-center justify-between ${
                      !hasQuotation ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2.5 rounded-lg border transition-colors ${
                          values.advance_payment_enabled && hasQuotation
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                            : 'bg-slate-800/80 border-slate-700/60 text-slate-400'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">
                          Register Advance Payment Received
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {hasQuotation
                            ? 'Record an advance payment receipt directly upon file creation'
                            : 'Enter an Estimation Amount in Section 4 to enable advance payment'}
                        </span>
                      </div>
                    </div>

                    <div className="relative inline-flex items-center shrink-0 ml-3">
                      <Field
                        type="checkbox"
                        name="advance_payment_enabled"
                        id="advance_payment_enabled"
                        disabled={!hasQuotation}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          if (!hasQuotation) return;
                          setFieldValue('advance_payment_enabled', e.target.checked);
                        }}
                        className="sr-only peer"
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          !hasQuotation
                            ? 'bg-slate-800/60 cursor-not-allowed'
                            : values.advance_payment_enabled
                            ? 'bg-cyan-600'
                            : 'bg-slate-800 hover:bg-slate-700 cursor-pointer'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full bg-white transition-transform transform mt-1 ml-1 ${
                            values.advance_payment_enabled && hasQuotation ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  </label>
                </div>

                {values.advance_payment_enabled && hasQuotation && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormField
                      name="advance_amount"
                      label="Advance Amount Received (₹)"
                      type="number"
                      min="0.01"
                      max={Number(values.estimated_amount)}
                      step="0.01"
                      placeholder="e.g. 10000"
                      required
                      helperText={`Maximum advance allowed: ₹${Number(values.estimated_amount).toLocaleString('en-IN')}`}
                    />
                    <FormDatePicker name="advance_payment_date" label="Payment Date" required />
                    <FormSelect
                      name="advance_payment_method"
                      label="Payment Method"
                      options={[
                        { value: 'UPI', label: 'UPI / GPay / PhonePe' },
                        { value: 'CASH', label: 'Cash' },
                        { value: 'CHEQUE', label: 'Cheque' },
                        { value: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT' },
                      ]}
                      required
                    />
                    <FormField
                      name="advance_reference_number"
                      label="Reference / Transaction ID (Optional)"
                      placeholder="e.g. UPI/123456789"
                    />
                    <div className="sm:col-span-2">
                      <FormTextarea
                        name="advance_notes"
                        label="Payment Notes (Optional)"
                        placeholder="Optional notes or receipt references..."
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end space-x-4 pt-2">
                <Link
                  to="/files"
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </Link>
                <SubmitButton className="px-6 py-2.5">
                  <Send className="w-4 h-4 mr-2" />
                  <span>Create & Register File</span>
                </SubmitButton>
              </div>
            </Form>
          );
        }}
      </Formik>
    </div>
  );
};
