import React from 'react';
import { useField } from 'formik';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  helperText?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({ label, helperText, ...props }) => {
  const [field, meta] = useField(props.name);
  const hasError = meta.touched && meta.error;

  return (
    <div className="space-y-1.5">
      <label htmlFor={props.id || props.name} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label} {props.required && <span className="text-rose-400">*</span>}
      </label>
      <textarea
        {...field}
        {...props}
        id={props.id || props.name}
        rows={props.rows || 3}
        className={`w-full px-3.5 py-2 rounded-lg bg-slate-900/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
          hasError
            ? 'border-rose-500/80 focus:ring-rose-500/30 text-rose-100'
            : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20 hover:border-slate-700'
        } ${props.disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''}`}
      />
      {hasError ? (
        <p className="text-xs text-rose-400 font-medium">{meta.error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
