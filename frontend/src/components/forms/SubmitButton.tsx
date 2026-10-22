import React from 'react';
import { useFormikContext } from 'formik';
import { Loader2 } from 'lucide-react';

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

export const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const { isSubmitting } = useFormikContext();

  const variantStyles = {
    primary: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-950/40 focus:ring-cyan-500/40',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500/40',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950/40 focus:ring-rose-500/40',
  };

  return (
    <button
      type="submit"
      disabled={isSubmitting || disabled}
      className={`relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin text-current" />}
      {children}
    </button>
  );
};
