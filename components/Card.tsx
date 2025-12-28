
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-800/50 bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-gray-800/50 border border-cyan-400/30 rounded-lg shadow-lg shadow-cyan-500/10 p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;