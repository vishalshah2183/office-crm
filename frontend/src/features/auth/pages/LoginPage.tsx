import React, { useState } from 'react';
import { Formik, Form } from 'formik';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ShieldAlert, ArrowRight } from 'lucide-react';
import { loginSchema } from '../validation/loginSchema';
import { authApi } from '../../../services/authApi';
import { useAuth } from '../../../app/providers/AuthContext';
import { useToast } from '../../../components/feedback/ToastContext';
import { FormField } from '../../../components/forms/FormField';
import { SubmitButton } from '../../../components/forms/SubmitButton';

export const LoginPage: React.FC = () => {
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
              Architecture & Office Management System
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl space-y-6">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Portal Login</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your mobile number or email to access your workspace.
            </p>
          </div>

          {apiError && (
            <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-xs">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          <Formik
            initialValues={{ identifier: '', password: '' }}
            validationSchema={loginSchema}
            onSubmit={async (values, { setSubmitting, setFieldError }) => {
              setApiError(null);
              try {
                const res = await authApi.login({
                  identifier: values.identifier,
                  password: values.password,
                });

                if (res.success && res.data?.token) {
                  const token = res.data.token;
                  const employee = res.data.employee || res.data.user;

                  if (employee) {
                    login(token, employee);
                    toast.success('Login Successful', `Welcome back, ${employee.name}`);
                    navigate('/dashboard');
                  } else {
                    setApiError('Failed to load user profile. Please try again.');
                  }
                } else {
                  setApiError(res.message || 'Invalid credentials');
                }
              } catch (err: any) {
                const errorMessage =
                  err.response?.data?.message || err.response?.data?.error || 'Authentication failed. Please check credentials.';
                setApiError(errorMessage);
                if (err.response?.data?.errors?.identifier) {
                  setFieldError('identifier', err.response.data.errors.identifier);
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {() => (
              <Form className="space-y-5">
                <FormField
                  name="identifier"
                  label="Mobile Number / Email"
                  type="text"
                  placeholder="9876543210 or user@example.com"
                  required
                  autoComplete="username"
                />

                <FormField
                  name="password"
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />

                <SubmitButton className="w-full py-2.5 mt-2 text-sm group">
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </SubmitButton>
              </Form>
            )}
          </Formik>
        </div>

        {/* Signup link */}
        <p className="text-center text-xs text-slate-500">
          New here?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
            Create an account
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
