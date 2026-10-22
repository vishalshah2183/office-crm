import * as Yup from 'yup';

export const roleSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Role name must be at least 2 characters')
    .required('Role name is required'),
  description: Yup.string().optional(),
});
