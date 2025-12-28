
import React, { useState, useRef, useMemo } from 'react';
import { ActiveView, MasterGateType, EngineConfig, MetricSet, Lattice2D, MasterMode } from './types';
import { SimulationEngine } from './services/simulationEngine';
import { useSimulation } from './hooks/useSimulation';
import SimulationCanvas from './components/SimulationCanvas.tsx';
import PhysicsExplorer from './components/PhysicsExplorer.tsx';
import AxialPongDemo from './components/AxialPongDemo.tsx';
import RoverDemo from './components/RoverDemo.tsx';
import MetaKernelVisualizer from './components/MetaKernelVisualizer.tsx';
import { 
    CubeIcon, BeakerIcon, GlobeIcon, TruckIcon,
    SymmetryIcon, ShieldCheckIcon, ArrowsRightLeftIcon, ArrowTrendingUpIcon, BoltIcon, ClockIcon,
    RotateClockwiseIcon, FlipHorizontalIcon, ArrowDownTrayIcon
} from './components/icons.tsx';

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
    modeLock?: MasterMode[];
    currentMode: MasterMode;
}> = ({ icon, label, isActive, onClick, modeLock, currentMode }) => {
    if (modeLock && !modeLock.includes(currentMode)) return null;

    return (
        <button
            onClick={onClick}
            className={`group flex items-center w-full px-5 py-3.5 text-left transition-all duration-300 relative rounded-xl mb-1 ${
            isActive
                ? 'text-cyan-300 bg-cyan-950/30'
                : 'text-gray-400 hover:bg-gray-800/20 hover:text-gray-200'
            }`}
        >
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-cyan-400 transition-all duration-300 rounded-r-full ${isActive ? 'opacity-100 shadow-[0_0_12px_#22d3ee]' : 'opacity-0'}`}></div>
            <div className={`w-5 h-5 mr-4 transition-colors duration-200 ${isActive ? 'text-cyan-400 scale-110' : 'text-gray-500 group-hover:text-gray-300'}`}>{icon}</div>
            <span className={`font-bold text-[11px] uppercase tracking-[0.15em] transition-all ${isActive ? 'translate-x-1' : ''}`}>{label}</span>
        </button>
    );
};

const getNeighborDensity = (latticeSlice: Lattice2D, row: number, col: number): number => {
    let activeNeighbors = 0;
    const size = 9;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = (row + dr + size) % size;
            const nc = (col + dc + size) % size;
            if (latticeSlice[nr][nc][0] === 1) activeNeighbors++;
        }
    }
    return activeNeighbors / 8;
};

const ControlPanel: React.FC<{
    engine: SimulationEngine;
    config: EngineConfig;
    zSlice: number;
    onZSliceChange: (slice: number) => void;
    isRunning: boolean;
    activity: number[][];
}> = ({ engine, config, zSlice, onZSliceChange, isRunning, activity }) => {
    const isPhysXzard = config.display.masterMode === MasterMode.PHYSXZARD;
    const isCinematic = config.display.masterMode === MasterMode.CINEMATIC;

    const handleExportState = () => {
        const stateToSave = engine.getFullState();
        const dataStr = JSON.stringify(stateToSave, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `cyclario_state_${new Date().toISOString()}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-5 space-y-8">
            <div className="space-y-4">
                <h3 className="font-orbitron text-[9px] text-cyan-600 uppercase tracking-[0.4em] font-black">Execution Status</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => engine.toggleRun()} 
                        className={`flex-grow px-5 py-3 rounded-xl font-black transition-all shadow-xl text-white text-[10px] uppercase tracking-wider ${isRunning ? 'bg-red-600/80 hover:bg-red-500 shadow-red-500/10' : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-500/20'}`}
                    >
                        {isRunning ? 'Halt Process' : 'Initialize Stack'}
                    </button>
                    {isPhysXzard && (
                        <button onClick={() => engine.reset()} className="px-4 py-3 bg-gray-800 rounded-xl hover:bg-gray-700 font-bold transition-all text-white text-[10px] uppercase">Reset</button>
                    )}
                    <button onClick={handleExportState} title="Export Manifest" className="px-4 py-3 bg-gray-900 text-gray-400 rounded-xl hover:bg-cyan-950 hover:text-cyan-400 transition-all border border-white/5"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                </div>
            </div>

            {(isPhysXzard || isCinematic) && (
                <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="font-bold text-[9px] text-cyan-600 uppercase tracking-[0.4em]">Spatial Logic</h3>
                        {isPhysXzard && (
                            <div className="flex items-center gap-1">
                                <button onClick={() => engine.rotateKernel()} className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><RotateClockwiseIcon className="w-4 h-4" /></button>
                                <button onClick={() => engine.flipKernel()} className="p-2 text-gray-500 hover:text-cyan-400 transition-colors"><FlipHorizontalIcon className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                    <MetaKernelVisualizer kernel={config.logic.metaKernel} activity={activity} />
                </div>
            )}

            <div className="space-y-4 border-t border-white/10 pt-6">
                <div className="flex justify-between">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Z-Layer Focus</label>
                    <span className="text-cyan-400 font-mono text-[10px]">{zSlice + 1} / 6</span>
                </div>
                <input type="range" min="0" max="5" step="1" value={zSlice} onChange={(e) => onZSliceChange(parseInt(e.target.value))} className="w-full custom-range" />
            </div>

            {isPhysXzard && (
                <div className="space-y-6 border-t border-white/10 pt-6">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Master Transformation</label>
                        <select 
                            value={config.logic.masterGate} 
                            onChange={(e) => engine.updateConfig({ logic: { ...config.logic, masterGate: e.target.value as MasterGateType } })} 
                            className="w-full p-3 bg-gray-950 border border-white/10 rounded-xl text-[10px] font-black text-cyan-400 uppercase tracking-widest focus:ring-1 focus:ring-cyan-500 outline-none"
                        >
                            {Object.values(MasterGateType).map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Thermal Noise</label>
                            <span className="text-cyan-400 font-mono text-[10px]">{(config.physics.noiseLevel * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="0.1" step="0.01" value={config.physics.noiseLevel} 
                            onChange={(e) => engine.updateConfig({ physics: { noiseLevel: parseFloat(e.target.value) } })} 
                            className="w-full custom-range" 
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Symmetric Fold</label>
                        <button 
                            onClick={() => engine.updateConfig({ logic: { ...config.logic, enforceSymmetry: !config.logic.enforceSymmetry } })} 
                            className={`relative inline-flex items-center h-5 rounded-full w-10 transition-all ${config.logic.enforceSymmetry ? 'bg-cyan-500 shadow-[0_0_12px_#22d3ee]' : 'bg-gray-800'}`}
                        >
                            <span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${config.logic.enforceSymmetry ? 'translate-x-5.5' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricDisplay: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  history: number[];
  max?: number;
}> = ({ icon, label, value, unit, history, max }) => {
  const [hoverData, setHoverData] = useState<{ index: number; value: number; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const width = 150;
  const height = 40;
  const padding = 2;

  const { dataMin, dataMax, colorClass, strokeColor } = useMemo(() => {
    const latestValue = history.length > 0 ? history[history.length - 1] : 0;
    const effectiveMax = max !== undefined ? max : (Math.max(...history, 0) || 1);
    const highIsBad = ['Δ-Symmetry', 'Latency (ps)', 'Δ (Delta)', 'Consumption', 'Loss'].includes(label);
    const scorePercent = highIsBad ? 100 - (latestValue / effectiveMax * 100) : (latestValue / effectiveMax * 100);

    let colorCls = 'text-green-400';
    let stroke = '#22c55e';
    if (scorePercent < 33) { colorCls = 'text-red-400'; stroke = '#f87171'; }
    else if (scorePercent < 66) { colorCls = 'text-yellow-400'; stroke = '#facc15'; }
    
    return {
      dataMin: Math.min(...history, 0),
      dataMax: Math.max(...history, 0.0001),
      colorClass: colorCls,
      strokeColor: stroke,
    };
  }, [history, max, label]);
  
  const getCoords = (val: number, i: number) => {
      const range = dataMax - dataMin;
      const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
      const y = (height - padding) - ((val - dataMin) / range) * (height - 2 * padding);
      return { x, y };
  };

  const linePath = useMemo(() => {
    if (history.length < 2) return '';
    return history.map((p, i) => {
        const {x, y} = getCoords(p, i);
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');
  }, [history, dataMin, dataMax]);

  return (
    <div className="relative flex flex-col items-center justify-between h-28 p-4 rounded-2xl bg-gray-900/40 border border-white/5 group overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2 w-full">
            <div className="w-3 h-3 text-gray-600 group-hover:text-cyan-400 transition-colors">{icon}</div>
            <p className="text-[9px] text-gray-600 uppercase tracking-widest font-black">{label}</p>
        </div>
        <p className={`text-2xl font-black font-orbitron tabular-nums transition-colors ${colorClass}`}>
            {hoverData ? hoverData.value.toFixed(label.includes('Stability') ? 3 : 1) : value}
            {unit && <span className="text-[10px] ml-1 font-mono font-light opacity-40">{unit}</span>}
        </p>
        <div className="w-full h-8 -mb-1 opacity-40 group-hover:opacity-100 transition-opacity">
           <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full h-full" onMouseMove={(e) => {
                if (!svgRef.current || history.length < 2) return;
                const rect = svgRef.current.getBoundingClientRect();
                const index = Math.round(((e.clientX - rect.left - padding) / (width - 2 * padding)) * (history.length - 1));
                if (index >= 0 && index < history.length) {
                    const { x, y } = getCoords(history[index], index);
                    setHoverData({ index, value: history[index], x, y });
                }
           }} onMouseLeave={() => setHoverData(null)}>
                <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="1.5" strokeLinejoin='round' strokeLinecap='round' />
                {hoverData && <circle cx={hoverData.x} cy={hoverData.y} r="2" fill={strokeColor} />}
           </svg>
        </div>
    </div>
  );
};

const MetricsDashboard: React.FC<{ metrics: MetricSet, metricsHistory: MetricSet[], mode: MasterMode }> = ({ metrics, metricsHistory, mode }) => {
    if (mode === MasterMode.CONSUMER) return null;
    const isPhysXzard = mode === MasterMode.PHYSXZARD;

    return (
        <div className="flex-shrink-0 bg-black/95 border-t border-white/10 p-4 backdrop-blur-3xl">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <MetricDisplay icon={<SymmetryIcon/>} label="Δ-Symmetry" value={metrics.deltaSymmetry.toFixed(0)} history={metricsHistory.map(m => m.deltaSymmetry)} max={100} />
                <MetricDisplay icon={<ShieldCheckIcon/>} label="Stability" value={metrics.thermalStability.toFixed(3)} history={metricsHistory.map(m => m.thermalStability)} max={1} />
                <MetricDisplay icon={<ArrowsRightLeftIcon/>} label="Inversion" value={(1 - metrics.reversibilityError).toFixed(3)} history={metricsHistory.map(m => 1 - m.reversibilityError)} max={1} />
                <MetricDisplay icon={<BoltIcon/>} label="Flux" value={metrics.energy.toFixed(3)} history={metricsHistory.map(m => m.energy)} max={1} />
                <MetricDisplay icon={<ArrowTrendingUpIcon/>} label="Loss" value={metrics.energyConsumption.toFixed(3)} history={metricsHistory.map(m => m.energyConsumption)} max={1.5} />
                <MetricDisplay icon={<ClockIcon/>} label="Latency" value={metrics.avgLatency.toFixed(2)} unit="ps" history={metricsHistory.map(m => m.avgLatency)} max={15} />
                {isPhysXzard && (
                    <MetricDisplay icon={<ArrowTrendingUpIcon/>} label="Delta" value={metrics.delta.toFixed(0)} history={metricsHistory.map(m => m.delta)} max={50} />
                )}
            </div>
        </div>
    );
}

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<ActiveView>(ActiveView.PHYSICS);
    const [zSlice, setZSlice] = useState<number>(0);
    const engine = useRef(new SimulationEngine()).current;
    const { lattice, thermalLattice, metrics, metricsHistory, config, isRunning } = useSimulation(engine);

    const averageKernelActivity = useMemo(() => {
        const activityMap = Array.from({ length: 3 }, () => Array(3).fill(0));
        const countMap = Array.from({ length: 3 }, () => Array(3).fill(0));
        if (!lattice || lattice.length === 0) return activityMap;
        for (let z = 0; z < lattice.length; z++) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    activityMap[r % 3][c % 3] += getNeighborDensity(lattice[z], r, c);
                    countMap[r % 3][c % 3]++;
                }
            }
        }
        return activityMap.map((row, r) => row.map((val, c) => val / countMap[r][c]));
    }, [lattice]);

    const currentMode = config.display.masterMode;

    return (
        <div className="flex h-screen bg-[#020408] text-gray-100 selection:bg-cyan-500/30 overflow-hidden">
            <aside className="w-80 bg-black border-r border-white/10 flex flex-col flex-shrink-0 z-30 shadow-[40px_0_100px_rgba(0,0,0,0.8)]">
                <div className="p-8 border-b border-white/10">
                    <h1 className="text-2xl font-orbitron font-black text-white tracking-tighter uppercase italic leading-none flex items-baseline gap-1">
                        Cyclario <span className="text-cyan-400 text-sm">PoC</span>
                    </h1>
                    <div className="flex items-center gap-2 mt-4">
                        <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-red-500'}`} />
                        <p className="text-[8px] text-gray-600 font-black uppercase tracking-[0.4em]">
                            {currentMode === MasterMode.CONSUMER ? 'Macro Operation' : 
                             currentMode === MasterMode.PHYSXZARD ? 'DSL Compliance' : 'Cinematic Stack'}
                        </p>
                    </div>
                </div>
                
                <nav className="flex-grow p-4 overflow-y-auto scrollbar-hide">
                    <h4 className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em] mb-6 px-4">Core Environments</h4>
                    <NavItem 
                        icon={<BeakerIcon />} label="Physics Layer" 
                        isActive={activeView === ActiveView.PHYSICS} onClick={() => setActiveView(ActiveView.PHYSICS)} 
                        currentMode={currentMode}
                    />
                    <NavItem 
                        icon={<CubeIcon />} label="Logic Core" 
                        isActive={activeView === ActiveView.SIMULATION} onClick={() => setActiveView(ActiveView.SIMULATION)} 
                        currentMode={currentMode}
                    />
                    <h4 className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em] my-6 px-4">Demonstrations</h4>
                    <NavItem 
                        icon={<ArrowsRightLeftIcon />} label="Hyper Qong" 
                        isActive={activeView === ActiveView.PONG} onClick={() => setActiveView(ActiveView.PONG)} 
                        currentMode={currentMode}
                    />
                    <NavItem 
                        icon={<TruckIcon />} label="Rover Evolution" 
                        isActive={activeView === ActiveView.TELEMETRIC_ROVER} onClick={() => setActiveView(ActiveView.TELEMETRIC_ROVER)} 
                        currentMode={currentMode}
                    />
                </nav>

                <div className="p-4 border-t border-white/10">
                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-[0.4em] mb-4 block px-4">Display Profile</label>
                    <div className="grid grid-cols-3 gap-1 bg-gray-950 rounded-xl p-1 border border-white/5">
                        {Object.values(MasterMode).map(mode => (
                            <button 
                                key={mode} 
                                onClick={() => engine.updateConfig({ display: { masterMode: mode } })}
                                className={`py-2 text-[8px] font-black rounded-lg transition-all uppercase tracking-tighter ${currentMode === mode ? 'bg-cyan-600 text-white shadow-lg' : 'text-gray-600 hover:text-gray-400'}`}
                            >
                                {mode.slice(0, 3)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-gray-950/20 max-h-[400px] overflow-y-auto">
                    {activeView === ActiveView.SIMULATION && (
                       <ControlPanel engine={engine} config={config} zSlice={zSlice} onZSliceChange={setZSlice} isRunning={isRunning} activity={averageKernelActivity} />
                    )}
                </div>
            </aside>

            <main className="flex-1 flex flex-col overflow-hidden relative">
                <div className="flex-grow min-h-0 bg-[#020408] relative">
                    {/* Background Detail */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.02] z-0 overflow-hidden">
                        <SymmetryIcon className="absolute -top-20 -right-20 w-[600px] h-[600px] text-cyan-500" />
                        <SymmetryIcon className="absolute -bottom-20 -left-20 w-[400px] h-[400px] text-pink-500" />
                    </div>

                    <div className="relative z-10 w-full h-full">
                        {activeView === ActiveView.SIMULATION && <SimulationCanvas fullLattice={lattice} fullThermalLattice={thermalLattice} zSlice={zSlice} metricsHistory={metricsHistory} config={config} onTileClick={(r, c) => engine.toggleTileState(zSlice, r, c)} isRunning={isRunning} />}
                        {activeView === ActiveView.PHYSICS && <PhysicsExplorer />}
                        {activeView === ActiveView.PONG && <AxialPongDemo metrics={metrics} lattice={lattice} />}
                        {activeView === ActiveView.TELEMETRIC_ROVER && <RoverDemo metrics={metrics} lattice={lattice} />}
                    </div>
                </div>

                <MetricsDashboard metrics={metrics} metricsHistory={metricsHistory} mode={currentMode} />
            </main>
        </div>
    );
};

export default App;
