import React, { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  variant = 'brand',
  ...props
}, ref) => {
  const baseClass = variant === 'operator' ? 'input-field-operator' : 'input-field';

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="floating-label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-surface-400" />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`${baseClass} ${Icon ? 'pl-10' : ''} ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/15' : ''}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 animate-fade-in-down">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
