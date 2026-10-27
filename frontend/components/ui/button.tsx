import type { ButtonHTMLAttributes } from 'react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
};

const variants = {
  primary: 'bg-teal-700 text-white shadow-sm hover:bg-teal-800 disabled:bg-teal-300',
  secondary: 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-100',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-50 text-rose-700 hover:bg-rose-100',
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const dimensions = size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2.5 text-sm';
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${dimensions} ${className}`}
      {...props}
    />
  );
}
