import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';
import * as Yup from 'yup';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../../app/providers/AuthContext';
import { useToast } from '../../../components/feedback/ToastContext';
import { FormField } from '../../../components/forms/FormField';
import { SubmitButton } from '../../../components/forms/SubmitButton';

const signupSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Full name is required'),
  mobile: Yup.string()
    .required('Mobile number is required'),
  email: Yup.string()
    .email('Please enter a valid email')
    .optional(),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

export const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();
  const [apiError, setApiError] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-2xl shadow-xl shadow-cyan-950/60 ring-1 ring-cyan-400/30">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              DEEP DESIGNING STUDIO
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Architecture & Design Management Portal
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-cyan-600/10 rounded-lg border border-cyan-500/20 shrink-0">
              <UserCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-200">Create an Account</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Register for access as Owner or Team Member.
              </p>
            </div>
          </div>

          {apiError && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <Formik
            initialValues={{ name: '', mobile: '', email: '', password: '', confirmPassword: '' }}
            validationSchema={signupSchema}
            onSubmit={async (values, { setSubmitting }) => {
              setApiError(null);
              try {
                const res = await authApi.signup({
                  name: values.name,
                  mobile: values.mobile,
                  email: values.email || undefined,
                  password: values.password,
                  confirmPassword: values.confirmPassword,
                });

                if (res.success && res.data?.token) {
                  const employee = res.data.employee || res.data.user;
                  if (employee) {
                    login(res.data.token, employee);
                    toast.success('Account Created', `Welcome, ${employee.name}! You are now logged in.`);
                    navigate('/dashboard');
                  } else {
                    setApiError('Account created but failed to load profile. Please log in.');
                    navigate('/login');
                  }
                } else {
                  setApiError(res.message || 'Signup failed. Please try again.');
                }
              } catch (err: any) {
                const errorMessage =
                  err.response?.data?.message || err.response?.data?.error || 'Signup failed. Please try again.';
                setApiError(errorMessage);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {() => (
              <Form className="space-y-4">
                <FormField
                  name="name"
                  label="Full Name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />

                <FormField
                  name="mobile"
                  label="Mobile / Phone Number"
                  type="text"
                  placeholder="9876543210"
                  required
                  autoComplete="tel"
                />

                <FormField
                  name="email"
                  label="Email Address (Optional)"
                  type="email"
                  placeholder="user@example.com"
                  autoComplete="email"
                />

                <FormField
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />

                <FormField
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />

                <SubmitButton className="w-full py-2.5 mt-2 text-sm group">
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </SubmitButton>
              </Form>
            )}
          </Formik>
        </div>

        {/* Login link */}
        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          DEEP DESIGNING STUDIO • Secure Session Guard Enabled
        </p>
      </div>
    </div>
  );
};
