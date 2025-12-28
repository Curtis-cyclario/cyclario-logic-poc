import React from 'react';
import { MetaKernel } from '../types';

// Updated KERNEL_MAP: Removed background classes and added explicit RGB color strings
// for dynamic styling based on activity. This makes the component more flexible.
export const KERNEL_MAP: { [key: number]: { name: string; className: string; fullName: string; color: string } } = {
  3: { name: 'XOR', className: 'border-purple-400', fullName: 'XOR', color: '192, 132, 252' },
  4: { name: 'THRESH', className: 'border-red-400', fullName: 'Threshold', color: '248, 113, 113' },
  5: { name: 'MEM', className: 'border-green-400', fullName: 'Memory', color: '74, 222, 128' },
  6: { name: 'NOT', className: 'border-blue-400', fullName: 'NOT', color: '96, 165, 250' },
};
export const KERNEL_DEFAULT = { name: 'ID', className: 'border-gray-500', fullName: 'Identity', color: '156, 163, 175' };

interface MetaKernelVisualizerProps {
    kernel: MetaKernel;
    activity: number[][]; // New prop to receive average activity data
}

const MetaKernelVisualizer: React.FC<MetaKernelVisualizerProps> = ({ kernel, activity }) => {
  return (
    <div>
        <div className="grid grid-cols-3 gap-1 p-1 bg-gray-900/50 rounded-md border border-cyan-500/20">
            {kernel.flat().map((weight, index) => {
                const kernelInfo = KERNEL_MAP[weight] || KERNEL_DEFAULT;
                const row = Math.floor(index / 3);
                const col = index % 3;
                // Get the calculated average activity for this specific meta-kernel cell
                const cellActivity = activity[row][col];

                // Dynamically generate styles based on cell activity
                const activityStyle: React.CSSProperties = {
                    backgroundColor: `rgba(${kernelInfo.color}, ${0.1 + cellActivity * 0.3})`, // Base opacity + activity
                    boxShadow: `inset 0 0 ${cellActivity * 10}px rgba(${kernelInfo.color}, ${cellActivity * 0.5})`, // Inner glow effect
                    transition: 'background-color 300ms ease-out, box-shadow 300ms ease-out',
                };
                
                // Slightly increase text size for more active cells
                const textStyle: React.CSSProperties = {
                    transform: `scale(${1 + cellActivity * 0.2})`,
                    transition: 'transform 300ms ease-out',
                };

                return (
                    <div
                        key={index}
                        className={`aspect-square flex items-center justify-center rounded-sm border ${kernelInfo.className}`}
                        style={activityStyle}
                        title={`${kernelInfo.fullName} (Avg. Activity: ${cellActivity.toFixed(2)})`}
                    >
                        <span 
                            className="text-xs font-mono font-bold text-gray-200"
                            style={textStyle}
                        >
                            {kernelInfo.name}
                        </span>
                    </div>
                );
            })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
            This fixed 3x3 pattern defines the spatial logic. Cell brightness indicates average neighborhood activity across the lattice.
        </p>
    </div>
  );
};

export default MetaKernelVisualizer;
