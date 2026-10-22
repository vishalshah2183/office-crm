import React, { useState } from 'react';
import { useField } from 'formik';
import { CloudCog, Eye, EyeOff } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  helperText?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, helperText, ...props }) => {
  console.log(props, "dsbjds");
  const [field, meta] = useField(props.name);
  const hasError = meta.touched && meta.error;
  const isPassword = props.type === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : props.type;

  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id || props.name} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label} {props.required && <span className="text-rose-400">*</span>}
      </label>
      <div className="relative">
        <input
          {...field}
          {...props}
          type={inputType}
          id={props.id || props.name}
          className={`w-full px-3.5 py-2 rounded-lg bg-slate-900/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${isPassword ? 'pr-10' : ''
            } ${hasError
              ? 'border-rose-500/80 focus:ring-rose-500/30 text-rose-100'
              : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20 hover:border-slate-700'
            } ${props.disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hasError ? (
        <p className="text-xs text-rose-400 font-medium">{meta.error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

