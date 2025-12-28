
import React, { useState, useRef, useEffect } from 'react';
import { Lattice3D, ThermalLattice3D, EngineConfig, MetricSet, MasterMode } from '../types';
import Card from './Card';
import MetricsChart from './MetricsChart';
import Lattice3DView from './Lattice3DView';
import { ResetViewIcon, SymmetryIcon } from './icons';
import LatticeGrid from './LatticeGrid';

interface SimulationCanvasProps {
  fullLattice: Lattice3D;
  fullThermalLattice: ThermalLattice3D;
  zSlice: number;
  metricsHistory: MetricSet[];
  config: EngineConfig;
  onTileClick: (row: number, col: number) => void;
  isRunning: boolean;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({ 
    fullLattice, 
    fullThermalLattice, 
    zSlice, 
    metricsHistory,
    config,
    onTileClick,
    isRunning
}) => {
  const mode = config.display.masterMode;
  const isConsumer = mode === MasterMode.CONSUMER;
  const isCinematic = mode === MasterMode.CINEMATIC;
  const isPhysXzard = mode === MasterMode.PHYSXZARD;

  const latticeSlice = fullLattice[zSlice];
  const thermalLatticeSlice = fullThermalLattice[zSlice];
  
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    panStart.current = { x: e.clientX - viewState.x, y: e.clientY - viewState.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - panStart.current.x;
    const newY = e.clientY - panStart.current.y;
    setViewState(prev => ({ ...prev, x: newX, y: newY }));
  };
  
  const resetView = () => setViewState({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const scaleAmount = -e.deltaY * 0.001;
      setViewState(prev => {
        const newScale = Math.max(0.2, Math.min(5, prev.scale + scaleAmount * prev.scale));
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const newX = mouseX - (mouseX - prev.x) * (newScale / prev.scale);
        const newY = mouseY - (mouseY - prev.y) * (newScale / prev.scale);
        return { x: newX, y: newY, scale: newScale };
      });
    };
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className={`w-full h-full flex flex-col ${isConsumer ? '' : 'xl:flex-row'} items-stretch justify-center p-8 gap-10 overflow-y-auto scrollbar-hide`}>
      {/* Primary Lattice Monitor - 2D Slice */}
      <div className={`w-full ${isConsumer ? 'max-w-4xl mx-auto' : 'xl:w-1/2'} flex flex-col gap-8`}>
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-4xl font-black text-white font-orbitron uppercase tracking-tighter italic">Lattice Monitor</h2>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">2D State Plane // Layer: {zSlice + 1}</p>
            </div>
            {!isConsumer && (
                <button onClick={resetView} className="px-4 py-2 bg-gray-900 hover:bg-cyan-600 rounded-xl text-gray-400 hover:text-white transition-all border border-white/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-xl">
                    <ResetViewIcon className="w-4 h-4" /> Reset view
                </button>
            )}
        </div>
        
        <div 
          ref={containerRef}
          className={`relative aspect-square bg-black/60 rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsPanning(false)}
          onMouseLeave={() => setIsPanning(false)}
        >
            <LatticeGrid 
                lattice={latticeSlice} 
                thermalLattice={thermalLatticeSlice}
                metaKernel={config.logic.metaKernel}
                onTileClick={onTileClick}
                isRunning={isRunning}
                style={{ transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`, transformOrigin: '0 0' }}
            />
            {isCinematic && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none scale-[1.5]">
                    <SymmetryIcon className="w-96 h-96 text-cyan-500" />
                </div>
            )}
            <div className="absolute bottom-8 left-8 pointer-events-none">
                <div className="px-5 py-2.5 bg-black/60 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <span className="text-[9px] font-black font-mono text-cyan-600 uppercase tracking-[0.3em]">Module_Link</span>
                    <p className="text-sm font-black font-orbitron text-white uppercase tracking-wider">Logic Manifold</p>
                </div>
            </div>
        </div>

        {isPhysXzard && (
            <Card className="p-8 bg-black/40 border-white/10 space-y-6 shadow-2xl rounded-[2.5rem]">
                <h3 className="text-[10px] font-black font-orbitron text-cyan-600 uppercase tracking-[0.4em]">Compliance Analytics</h3>
                <div className="grid grid-cols-1 gap-6">
                  <MetricsChart history={metricsHistory} metricKey="avgLatency" label="Latency (ps)" color="#22d3ee" unit="ps" />
                  <MetricsChart history={metricsHistory} metricKey="reversibilityError" label="Reversibility Error (δ)" color="#f472b6" unit="δ" />
                </div>
            </Card>
        )}
      </div>

      {/* Secondary Monitor - 3D Manifold */}
      {!isConsumer && (
        <div className="w-full xl:w-1/2 flex flex-col gap-8">
            <div className="flex flex-col flex-grow">
                <div className="mb-6">
                    <h2 className="text-4xl font-black text-white font-orbitron uppercase tracking-tighter italic">Voxel Manifold</h2>
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-2">Neuromorphic 3D Quantum Photonic Logic Stack</p>
                </div>
                <Card className={`flex-grow p-1 bg-black border-cyan-400/10 shadow-inner rounded-[3.5rem] overflow-hidden relative ${isCinematic ? 'border-2 shadow-[0_0_80px_rgba(34,211,238,0.1)]' : ''}`}>
                    <div className="absolute inset-0 pointer-events-none z-10 border-[20px] border-black rounded-[3.5rem] opacity-40 shadow-[inset_0_0_120px_black]"></div>
                    <Lattice3DView lattice={fullLattice} thermalLattice={fullThermalLattice} highlightedSlice={zSlice} />
                    <div className="absolute top-10 left-10 z-20 pointer-events-none">
                        <div className="px-5 py-2.5 bg-cyan-950/40 border border-cyan-500/20 rounded-2xl backdrop-blur-xl shadow-xl">
                            <p className="text-[8px] font-black font-mono text-cyan-400 uppercase tracking-[0.5em]">Logic_Stack</p>
                            <p className="text-xs font-black font-orbitron text-white uppercase tracking-[0.2em]">6 Layer / 486 Unit Lattice</p>
                        </div>
                    </div>
                </Card>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
                <Card className="p-8 bg-cyan-950/10 border-white/10 backdrop-blur-md rounded-[2.5rem] shadow-xl">
                    <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.3em] mb-4">Entropy Level</p>
                    <div className="flex items-end justify-between">
                        <p className="text-4xl font-black font-orbitron text-white">{(fullThermalLattice.flat(2).reduce((a, b) => a + b, 0) / (9*9*6) * 100).toFixed(1)}%</p>
                        <div className="w-24 h-1.5 bg-gray-950 rounded-full overflow-hidden mb-2 border border-white/5">
                            <div className="h-full bg-cyan-500 shadow-[0_0_10px_#22d3ee]" style={{ width: '65%' }}></div>
                        </div>
                    </div>
                </Card>
                <Card className="p-8 bg-pink-950/10 border-white/10 text-right backdrop-blur-md rounded-[2.5rem] shadow-xl">
                    <p className="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em] mb-4">Phase Resonance</p>
                    <div className="flex items-end justify-between flex-row-reverse">
                        <p className="text-4xl font-black font-orbitron text-white">{(metricsHistory[metricsHistory.length-1]?.thermalStability * 100 || 0).toFixed(1)}%</p>
                        <div className="w-24 h-1.5 bg-gray-950 rounded-full overflow-hidden mb-2 border border-white/5">
                            <div className="h-full bg-pink-500 shadow-[0_0_10px_#ec4899]" style={{ width: '82%' }}></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
      )}
    </div>
  );
};

export default SimulationCanvas;
