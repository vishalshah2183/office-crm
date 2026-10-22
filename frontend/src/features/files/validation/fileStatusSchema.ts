import * as Yup from 'yup';

export const fileStatusSchema = Yup.object().shape({
  status: Yup.string().required('Target status is required'),
  notes: Yup.string().optional(),
});
