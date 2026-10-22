import * as Yup from 'yup';

export const paymentSchema = Yup.object().shape({
  amount: Yup.number()
    .typeError('Payment amount must be a valid number')
    .positive('Payment amount must be greater than zero')
    .required('Payment amount is required'),
  payment_type: Yup.string().required('Payment type is required (e.g. ADVANCE, PARTIAL, FINAL)'),
  payment_date: Yup.string().required('Payment date is required'),
  payment_method: Yup.string().required('Payment method is required (e.g. UPI, CASH, CHEQUE, NEFT)'),
  reference_number: Yup.string().optional(),
  notes: Yup.string().optional(),
});
