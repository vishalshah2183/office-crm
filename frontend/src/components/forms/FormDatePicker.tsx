import React from 'react';
import { useField, useFormikContext } from 'formik';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

interface FormDatePickerProps {
  name: string;
  label: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  disabled?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

export const FormDatePicker: React.FC<FormDatePickerProps> = ({
  name,
  label,
  required,
  helperText,
  placeholder = 'Select date',
  disabled = false,
  maxDate,
  minDate,
}) => {
  const [field, meta] = useField(name);
  const { setFieldValue, setFieldTouched } = useFormikContext<any>();
  const hasError = meta.touched && meta.error;

  // Convert stored string YYYY-MM-DD to Date object for react-datepicker
  const parseValueToDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'string') {
      const parts = val.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      }
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
  };

  const selectedDate = parseValueToDate(field.value);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      setFieldValue(name, `${year}-${month}-${day}`);
    } else {
      setFieldValue(name, '');
    }
    setFieldTouched(name, true, false);
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label htmlFor={name} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="yyyy-MM-dd"
          placeholderText={placeholder}
          disabled={disabled}
          maxDate={maxDate}
          minDate={minDate}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          className={`w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/80 border text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all cursor-pointer ${
            hasError
              ? 'border-rose-500/80 focus:ring-rose-500/30 text-rose-100'
              : 'border-slate-800 focus:border-cyan-500 focus:ring-cyan-500/20 hover:border-slate-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''}`}
          wrapperClassName="w-full"
        />
        <Calendar className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {hasError ? (
        <p className="text-xs text-rose-400 font-medium">{meta.error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};
