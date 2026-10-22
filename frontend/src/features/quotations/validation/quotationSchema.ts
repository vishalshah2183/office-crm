import * as Yup from 'yup';

export const quotationSchema = Yup.object().shape({
  quotation_number: Yup.string().required('Quotation number is required'),
  amount: Yup.number()
    .typeError('Amount must be a valid number')
    .positive('Amount must be greater than zero')
    .required('Quotation amount is required'),
  status: Yup.string().default('DRAFT'),
});
