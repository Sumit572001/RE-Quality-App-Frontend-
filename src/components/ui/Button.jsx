import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'btn-primary'; // default to primary
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline',
    danger: 'btn-danger',
    success: 'btn-success',
    ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 py-2 px-4 rounded-xl transition-all active:scale-95',
  };

  const currentVariant = variants[variant] || variants.primary;

  return (
    <button
      disabled={disabled || loading}
      className={`${currentVariant} ${className} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
      {...props}
    >
      {loading ? (
        <span className="spinner border-current w-4 h-4"></span>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4" />}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
