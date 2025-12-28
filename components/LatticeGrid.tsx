
import React, { useMemo } from 'react';
import { Lattice2D, MetaKernel, TileState, ThermalLattice } from '../types';
import { KERNEL_DEFAULT, KERNEL_MAP } from './MetaKernelVisualizer';

interface TileProps {
  state: TileState;
  density: number;
}

const Tile: React.FC<TileProps> = React.memo(({ state, density }) => {
  const [c0, c1] = state;
  // Use CSS variables for performance during high-frequency updates
  const hue = c1 * 120 + 180;
  const lum = 50 + (density * 20);
  const opacity = c0 * 0.9 + 0.1;
  const scale = c0 === 1 ? 1 + density * 0.1 : 0.95;
  
  const style = useMemo(() => ({
    '--tile-hue': hue,
    '--tile-lum': `${lum}%`,
    '--tile-opacity': opacity,
    '--tile-scale': scale,
    backgroundColor: `hsla(var(--tile-hue), 100%, var(--tile-lum), var(--tile-opacity))`,
    boxShadow: c0 === 1 ? `0 0 ${10 + density * 15}px hsla(var(--tile-hue), 100%, var(--tile-lum), 0.6)` : 'none',
    transform: `scale(var(--tile-scale)) translateZ(0)`,
    willChange: 'transform, background-color, box-shadow'
  } as React.CSSProperties), [hue, lum, opacity, scale, c0, density]);

  return (
    <div className="w-full h-full transition-transform duration-150 ease-out rounded-sm" style={style} />
  );
});

const ThermalTile: React.FC<{ temperature: number }> = React.memo(({ temperature }) => {
  const opacity = Math.min(0.8, temperature * 0.7);
  const style = useMemo(() => ({
    opacity,
    background: `radial-gradient(circle, rgba(255, 153, 0, 1) 0%, rgba(255, 60, 0, 0) 70%)`,
    willChange: 'opacity'
  }), [opacity]);

  return (
    <div className="absolute inset-0 transition-opacity duration-300 pointer-events-none mix-blend-screen" style={style} />
  );
});

const getNeighborDensity = (lattice: Lattice2D, row: number, col: number): number => {
  let active = 0;
  const s = 9;
  // Inline bounds check for extreme speed
  const r_prev = (row - 1 + s) % s;
  const r_next = (row + 1) % s;
  const c_prev = (col - 1 + s) % s;
  const c_next = (col + 1) % s;

  if (lattice[r_prev][c_prev][0]) active++;
  if (lattice[r_prev][col][0]) active++;
  if (lattice[r_prev][c_next][0]) active++;
  if (lattice[row][c_prev][0]) active++;
  if (lattice[row][c_next][0]) active++;
  if (lattice[r_next][c_prev][0]) active++;
  if (lattice[r_next][col][0]) active++;
  if (lattice[r_next][c_next][0]) active++;

  return active / 8;
};

interface LatticeGridProps {
  lattice: Lattice2D;
  thermalLattice: ThermalLattice;
  metaKernel: MetaKernel;
  onTileClick: (row: number, col: number) => void;
  isRunning: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const LatticeGrid: React.FC<LatticeGridProps> = ({ lattice, thermalLattice, metaKernel, onTileClick, isRunning, className, style }) => {
  const tiles = useMemo(() => {
    const flat = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const i = r * 9 + c;
        const kw = metaKernel[r % 3][c % 3];
        const density = getNeighborDensity(lattice, r, c);
        const kernelInfo = KERNEL_MAP[kw] || KERNEL_DEFAULT;
        flat.push({ r, c, tile: lattice[r][c], density, kw, kernelInfo });
      }
    }
    return flat;
  }, [lattice, metaKernel]);

  return (
    <div className={`p-6 bg-gray-950/90 rounded-[2.5rem] border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] ${className}`} style={style}>
      <div className="grid grid-cols-9 gap-2">
        {tiles.map(({ r, c, tile, density, kernelInfo }, i) => (
          <div 
            key={i} 
            className={`aspect-square relative rounded-md overflow-hidden ${!isRunning ? 'cursor-pointer hover:ring-2 hover:ring-cyan-400/50 transition-all' : ''}`}
            onClick={() => !isRunning && onTileClick(r, c)}
          >
            <Tile state={tile} density={density} />
            <ThermalTile temperature={thermalLattice[r][c]} />
            
            <div 
              className="absolute inset-0 flex items-center justify-center pointer-events-none mix-blend-overlay"
              style={{ opacity: 0.1 + (tile[0] * 0.4) + (density * 0.5) }}
            >
              <span className="text-[12px] font-black font-orbitron text-white drop-shadow-md">
                {kernelInfo.name.charAt(0)}
              </span>
            </div>
            
            {!isRunning && <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatticeGrid;
