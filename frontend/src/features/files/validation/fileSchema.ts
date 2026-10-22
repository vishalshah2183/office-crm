import * as Yup from 'yup';

export const fileSchema = Yup.object().shape({
  file_number: Yup.string().required('File number is required'),
  work_type: Yup.string().required('Work type is required'),
  applicant_name: Yup.string().required('Applicant name is required'),
  applicant_address: Yup.string().optional(),
  applicant_mobile: Yup.string().trim().required('Mobile number is required'),
  revenue_survey_no: Yup.string().optional(),
  city_survey_no: Yup.string().optional(),
  tp_scheme_no: Yup.string().optional(),
  final_plot_no: Yup.string().optional(),
  plot_no: Yup.string().optional(),
  permission_type: Yup.string().when('work_type', {
    is: 'Building Permission',
    then: (schema) => schema.required('Permission type is required'),
    otherwise: (schema) => schema.notRequired().nullable(),
  }),
  floors: Yup.string().optional(),
  specific_built_up_area: Yup.number()
    .typeError('Built-up area must be a valid number')
    .positive('Built-up area must be positive')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  estimated_amount: Yup.number()
    .typeError('Estimation amount must be a valid number')
    .positive('Estimation amount must be positive')
    .nullable()
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  advance_payment_enabled: Yup.boolean().optional(),
  advance_amount: Yup.number()
    .typeError('Advance amount must be a valid number')
    .when('advance_payment_enabled', {
      is: true,
      then: (schema) => schema
        .required('Advance amount is required')
        .positive('Advance amount must be positive')
        .test('within-quotation', 'Advance payment cannot exceed the quotation amount', function (value) {
          const quotation = this.parent.estimated_amount;
          return quotation !== null && quotation !== undefined && quotation !== '' && Number(value) <= Number(quotation);
        }),
      otherwise: (schema) => schema.nullable().notRequired(),
    })
    .transform((value, originalValue) => (originalValue === '' ? null : value)),
  advance_payment_date: Yup.string().when('advance_payment_enabled', {
    is: true,
    then: (schema) => schema.required('Payment date is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  advance_payment_method: Yup.string().when('advance_payment_enabled', {
    is: true,
    then: (schema) => schema.required('Payment method is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
});
