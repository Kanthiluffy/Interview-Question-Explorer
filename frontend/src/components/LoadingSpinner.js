import React from 'react';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className={`animate-spin rounded-full border-2 border-gray-200 border-t-blue-600 ${sizes[size]}`}></div>
      {text && <p className="mt-4 text-gray-600 font-medium">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
