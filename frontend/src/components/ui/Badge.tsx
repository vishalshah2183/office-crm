import React from 'react';
import { getStatusBadgeStyle } from '../../utils/formatters';

interface BadgeProps {
  status?: string;
  label?: string;
  variant?: 'default' | 'outline' | 'custom';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label, className = '' }) => {
  const style = getStatusBadgeStyle(status);
  const text = label || style.label;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.className} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {text}
    </span>
  );
};
