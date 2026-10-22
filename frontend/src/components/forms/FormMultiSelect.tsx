import React from 'react';
import { useField, useFormikContext } from 'formik';

export interface Option {
  value: string;
  label: string;
}

interface FormMultiSelectProps {
  name: string;
  label: string;
  options: Option[];
  required?: boolean;
  helperText?: string;
}

export const FormMultiSelect: React.FC<FormMultiSelectProps> = ({
  name,
  label,
  options,
  required,
  helperText,
}) => {
  const [field, meta] = useField<string | string[]>(name);
  const { setFieldValue, setFieldTouched } = useFormikContext();

  const currentValues: string[] = Array.isArray(field.value)
    ? field.value
    : typeof field.value === 'string' && field.value.trim() !== ''
    ? field.value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const toggleOption = (val: string) => {
    let updated: string[];
    if (currentValues.includes(val)) {
      updated = currentValues.filter((v) => v !== val);
    } else {
      const allOptionValues = options.map((o) => o.value);
      updated = [...currentValues, val].sort(
        (a, b) => allOptionValues.indexOf(a) - allOptionValues.indexOf(b)
      );
    }
    const newValue = updated.join(', ');
    setFieldValue(name, newValue);
    setFieldTouched(name, true, false);
  };

  const hasError = meta.touched && meta.error;

  return (
    <div className="space-y-1.5 col-span-full">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map((opt) => {
          const isSelected = currentValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm shadow-cyan-950/50'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {isSelected ? '✓ ' : '+ '}
              {opt.label}
            </button>
          );
        })}
      </div>
      {currentValues.length > 0 && (
        <p className="text-[11px] text-cyan-400/90 font-medium pt-0.5">
          Selected: {currentValues.join(', ')}
        </p>
      )}
      {hasError ? (
        <p className="text-xs text-rose-400 font-medium">{meta.error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
