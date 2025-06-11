import React from 'react';

const TagBadge = ({ tag, variant = 'default', size = 'sm', onClick }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-800 border-blue-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    danger: 'bg-red-100 text-red-800 border-red-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const baseClasses = `inline-flex items-center font-semibold rounded-full border transition-all duration-150`;
  const variantClasses = variants[variant] || variants.default;
  const sizeClasses = sizes[size] || sizes.sm;
  const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : '';

  return (
    <span
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${interactiveClasses}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {tag}
    </span>
  );
};

export default TagBadge;
