import * as Yup from 'yup';

export const loginSchema = Yup.object().shape({
  identifier: Yup.string()
    .required('Mobile number or Email is required'),
  password: Yup.string()
    .required('Password is required'),
});
