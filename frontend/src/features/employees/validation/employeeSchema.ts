import * as Yup from 'yup';

export const employeeSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  mobile: Yup.string()
    .required('Mobile number is required'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .optional(),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  designation: Yup.string()
    .required('Designation is required'),
  role_id: Yup.number()
    .typeError('Please select a valid role')
    .required('Role is required'),
  monthly_salary: Yup.number()
    .typeError('Salary must be a valid number')
    .min(0, 'Salary cannot be negative')
    .optional(),
  upad_balance: Yup.number()
    .typeError('UPAD balance must be a valid number')
    .min(0, 'UPAD balance cannot be negative')
    .optional(),
});

export const employeeUpdateSchema = employeeSchema.shape({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .optional(),
});
