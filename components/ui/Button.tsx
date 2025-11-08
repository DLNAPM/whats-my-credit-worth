
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'normal' | 'small';
}

const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', size = 'normal', ...props }) => {
  const baseClasses = "font-bold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center gap-2 justify-center";
  
  const variantClasses = {
    primary: 'bg-brand-primary hover:bg-brand-secondary text-white focus:ring-brand-primary',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-gray-100 focus:ring-gray-400',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
  };

  const sizeClasses = {
      normal: 'py-2 px-4 text-base',
      small: 'py-1 px-2 text-sm'
  }

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
