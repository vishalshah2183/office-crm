import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  popperPlacement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  preventFlip?: boolean;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  className = '',
  disabled = false,
  popperPlacement,
  preventFlip = false,
}) => {
  const parseValueToDate = (val: string): Date | null => {
    if (!val) return null;
    const parts = val.split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    const parsed = new Date(val);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const selectedDate = parseValueToDate(value);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    } else {
      onChange('');
    }
  };

  return (
    <div className="relative w-full">
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="yyyy-MM-dd"
        placeholderText={placeholder}
        disabled={disabled}
        showMonthDropdown
        showYearDropdown
        dropdownMode="select"
        popperPlacement={popperPlacement}
        popperModifiers={preventFlip ? [{ name: 'flip', options: { fallbackPlacements: [] } }] : undefined}
        className={`w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-700'
        } ${className}`}
        wrapperClassName="w-full"
      />
      <Calendar className="w-3.5 h-3.5 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
};
