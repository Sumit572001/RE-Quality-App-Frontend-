import React from 'react';

const Skeleton = ({ className = '', variant = 'rect' }) => {
  const baseClass = "bg-gray-200 animate-pulse-soft";
  const variants = {
    rect: "rounded-xl",
    circle: "rounded-full",
    text: "rounded h-3 w-3/4 mb-2"
  };

  return (
    <div className={`${baseClass} ${variants[variant]} ${className}`} />
  );
};

export const CardSkeleton = () => (
  <div className="card mb-4 bg-white">
    <div className="flex gap-4">
      <Skeleton className="w-12 h-12 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" className="w-1/2 h-4" />
        <Skeleton variant="text" className="w-1/4 h-3" />
        <Skeleton variant="text" className="w-full h-3" />
      </div>
    </div>
  </div>
);

export default Skeleton;
