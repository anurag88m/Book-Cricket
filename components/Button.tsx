import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'success' | 'warning';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "retro-text px-6 py-3 text-xl uppercase tracking-wider transform transition-all active:scale-95 active:border-b-0 border-b-4 rounded-lg shadow-lg";
  
  const variants = {
    primary: "bg-blue-500 hover:bg-blue-400 border-blue-700 text-white",
    danger: "bg-red-500 hover:bg-red-400 border-red-700 text-white",
    success: "bg-green-500 hover:bg-green-400 border-green-700 text-white",
    warning: "bg-yellow-400 hover:bg-yellow-300 border-yellow-600 text-black"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};