import * as Yup from 'yup';

export const expenseSchema = Yup.object().shape({
  category: Yup.string().required('Expense category is required (e.g. OFFICE, TRAVEL, PRINTING, UTILITIES)'),
  amount: Yup.number()
    .typeError('Amount must be a valid number')
    .positive('Amount must be greater than zero')
    .required('Expense amount is required'),
  expense_date: Yup.string().required('Expense date is required'),
  description: Yup.string().optional(),
  employee_id: Yup.number()
    .nullable()
    .when('category', {
      is: (category: string) => category === 'SALARY' || category === 'UPAD',
      then: (schema) => schema.required('Select an employee for salary or UPAD records'),
      otherwise: (schema) => schema.optional(),
    }),
});
