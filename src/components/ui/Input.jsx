import React from 'react';

const Input = ({
  label,
  error,
  icon: Icon,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div className={`w-full ${containerClassName}`}>
      {label && <label className="input-label" htmlFor={props.id || props.name}>{label}</label>}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={18} />
          </div>
        )}
        <input
          className={`input-field ${Icon ? 'pl-11' : ''} ${error ? 'border-red-500 bg-red-50' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] mt-1 font-semibold ml-1">{error}</p>}
    </div>
  );
};

export default Input;
