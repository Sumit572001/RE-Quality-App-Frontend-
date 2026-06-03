import React from 'react';

const Badge = ({ children, variant = 'blue', className = '' }) => {
  const variants = {
    blue: 'badge-blue',
    orange: 'badge-orange',
    green: 'badge-green',
    red: 'badge-red',
    gray: 'bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold'
  };

  return (
    <span className={`${variants[variant] || variants.blue} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;
