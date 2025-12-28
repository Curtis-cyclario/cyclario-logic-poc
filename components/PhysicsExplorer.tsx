
import React, { useState } from 'react';
import Card from './Card';
import InteractiveWaveform from './InteractiveWaveform';

const AnimatedGateDiagram: React.FC<{
  title: string;
  children: React.ReactNode;
  animation: (isAnimating: boolean, isExcited: boolean) => React.ReactNode;
  wide?: boolean;
  description?: string;
  techSpecs?: string;
}> = ({ title, children, animation, wide = false, description, techSpecs }) => {
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExcited, setIsExcited] = useState(false);

    return (
        <div 
            className="flex flex-col items-center gap-3 group"
            onMouseEnter={() => setIsAnimating(true)}
            onMouseLeave={() => setIsAnimating(false)}
        >
            <div 
                className={`${wide ? 'w-72 h-48' : 'w-48 h-36'} bg-gray-950 border border-white/5 transition-all duration-500 ${isExcited ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.15)]' : 'hover:border-cyan-500/50'} rounded-2xl flex items-center justify-center relative overflow-hidden cursor-pointer`}
                onClick={() => setIsExcited(!isExcited)}
            >
                <div className={`absolute inset-0 transition-opacity duration-500 ${isExcited ? 'bg-yellow-400/5' : 'bg-cyan-500/5'} group-hover:opacity-100 opacity-0`}></div>
                {children}
                {animation(isAnimating, isExcited)}
                <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 rounded text-[7px] font-black font-mono text-gray-600 group-hover:text-cyan-400 uppercase tracking-widest">
                    {isExcited ? 'Operational' : 'Idle'}
                </div>
            </div>
            
            <div className="text-center px-4">
                <p className={`text-[10px] font-black font-orbitron uppercase tracking-widest transition-colors ${isExcited ? 'text-yellow-400' : 'text-gray-400 group-hover:text-cyan-400'}`}>{title}</p>
                {description && <p className="text-[9px] text-gray-600 mt-2 max-w-[160px] leading-tight font-mono">{description}</p>}
            </div>
        </div>
    );
};

const PhysicsExplorer: React.FC = () => {
    const [phaseShift, setPhaseShift] = useState(0);

  return (
    <div className="p-10 h-full overflow-y-auto scrollbar-hide">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-10 mb-12">
          <div className="max-w-3xl">
            <h2 className="text-5xl font-black text-white font-orbitron tracking-tighter italic uppercase leading-none">
                Photonic <span className="text-cyan-400 underline decoration-cyan-500/30">Invariants</span>
            </h2>
            <p className="text-gray-500 text-sm mt-6 leading-relaxed font-mono">
                Computation via dual-rail photonic logic requires absolute energy conservation and reversibility. 
                Our simulation enforces <span className="text-cyan-300">Photonic DSL</span> mandates at sub-nanosecond intervals, 
                treating logical switching as a lossless waveguide transformation rather than a dissipative transistor event.
            </p>
          </div>
          <div className="flex-shrink-0 px-6 py-4 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl backdrop-blur-xl">
             <p className="text-[8px] font-black font-mono uppercase text-cyan-500 tracking-[0.4em] mb-2">DSL Unitary Status</p>
             <div className="flex items-center gap-3">
                <div className="relative">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping opacity-20"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                </div>
                <span className="text-xs font-black font-orbitron text-white uppercase">Verified_Link</span>
             </div>
          </div>
      </div>

      <Card className="mb-12 p-10 bg-black/40 border-white/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
            <span className="text-[8px] font-mono font-black text-cyan-600 uppercase tracking-[1em]">Spectral_Probe_V4</span>
        </div>
        <InteractiveWaveform />
      </Card>

      <div className="mb-12">
        <div className="flex justify-between items-end mb-8 border-b border-white/5 pb-4">
            <div>
                <h3 className="text-2xl font-black text-white font-orbitron uppercase italic tracking-tighter">Primitive Gate Set</h3>
                <p className="text-[10px] font-mono text-gray-600 uppercase mt-1">Foundational components of the 3D logic manifold</p>
            </div>
            <span className="text-[8px] font-mono text-gray-700 bg-white/5 px-3 py-1 rounded-full uppercase tracking-widest font-black">Interactivity Enabled</span>
        </div>
        
        <div className="flex justify-around gap-10 flex-wrap items-start">
            <AnimatedGateDiagram 
                title="RSWAP Gate" 
                description="Lossless waveguide crossing using dual-rail parity."
                animation={(isAnimating, isExcited) => (
                <>
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_15px_#22d3ee] ${isAnimating || isExcited ? 'animate-rswap-pulse-a' : ''}`}/>
                  <div className={`absolute right-6 top-1/2 -translate-y-1/2 w-3 h-3 bg-pink-500 rounded-full shadow-[0_0_15px_#ec4899] ${isAnimating || isExcited ? 'animate-rswap-pulse-b' : ''}`}/>
                </>
            )}>
                <div className="absolute w-px h-1/2 bg-white/10 transform rotate-45"></div>
                <div className="absolute w-px h-1/2 bg-white/10 transform -rotate-45"></div>
            </AnimatedGateDiagram>

            <AnimatedGateDiagram 
                title="BEND Geometry" 
                description="Total internal reflection with zero radiation loss."
                animation={(isAnimating, isExcited) => (
                 <div className={`absolute w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15] ${isAnimating || isExcited ? 'animate-bend-pulse' : ''}`}
                    style={{ offsetPath: 'path("M 10 90 L 120 90 C 130 90, 140 80, 140 60 L 140 10")' }}
                 />
            )}>
                 <div className="absolute left-4 top-[90px] w-[136px] h-px bg-white/5"></div>
                 <div className="absolute right-[52px] top-4 w-px h-[74px] bg-white/5"></div>
                 <div className="absolute right-[52px] top-[58px] w-12 h-12 border-l border-t border-white/10 rounded-tl-3xl"></div>
            </AnimatedGateDiagram>

             <AnimatedGateDiagram 
                title="Evanescent Coupler" 
                description="Reversible 50/50 split via sub-wavelength field coupling."
                animation={(isAnimating, isExcited) => (
                <>
                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] ${isAnimating || isExcited ? 'animate-split-pulse' : ''}`} />
                    <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] ${isAnimating || isExcited ? 'animate-split-pulse-top' : ''}`} />
                    <div className={`absolute left-1/2 -translate-x-1/2 top-1/2 w-3 h-3 bg-cyan-400 rounded-full shadow-[0_0_12px_#22d3ee] ${isAnimating || isExcited ? 'animate-split-pulse-bottom' : ''}`} />
                </>
             )}>
                <div className="absolute left-0 top-1/2 w-1/2 h-px bg-white/5 -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-1/4 w-1/2 h-px bg-white/5 -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-3/4 w-1/2 h-px bg-white/5 -translate-y-1/2"></div>
                <div className="absolute left-1/2 top-1/4 w-px h-1/2 bg-white/5 -translate-x-1/2"></div>
            </AnimatedGateDiagram>

            <AnimatedGateDiagram 
                title="Mach-Zehnder Circuit" 
                wide
                description={`Phase interference control (φ = ${(phaseShift * Math.PI).toFixed(2)}).`}
                animation={(isAnimating, isExcited) => {
                    const isConstructive = phaseShift < 0.2 || phaseShift > 0.8;
                    return (
                        <>
                            <circle r="4" fill="#22d3ee" className={`shadow-[0_0_12px_#22d3ee] ${isAnimating || isExcited ? 'animate-mzi-pulse-initial' : 'opacity-0'}`} style={{ offsetPath: 'path("M 16 96 L 64 96")' }} />
                            <circle r="4" fill="#22d3ee" className={`shadow-[0_0_12px_#22d3ee] ${isAnimating || isExcited ? 'animate-mzi-pulse-split' : 'opacity-0'}`} style={{ offsetPath: 'path("M 64 96 L 128 32 L 192 32 L 192 96")' }} />
                            <circle r="4" fill="#ec4899" className={`shadow-[0_0_12px_#ec4899] ${isAnimating || isExcited ? 'animate-mzi-pulse-split' : 'opacity-0'}`} style={{ offsetPath: 'path("M 64 96 L 128 160 L 192 160 L 192 96")' }} />

                            {isConstructive && <circle r="5" fill="#22d3ee" className={`shadow-[0_0_20px_#22d3ee] ${isAnimating || isExcited ? 'animate-mzi-pulse-out' : 'opacity-0'}`} style={{ offsetPath: 'path("M 192 96 L 256 96")' }} />}
                            {!isConstructive && <circle r="4" fill="#f43f5e" className={`shadow-[0_0_10px_#f43f5e] ${isAnimating || isExcited ? 'animate-mzi-pulse-out' : 'opacity-0'}`} style={{ offsetPath: 'path("M 192 96 L 240 32")' }} />}
                            
                            {isExcited && (
                                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[80%] bg-black/90 p-3 rounded-xl border border-white/10 z-30 shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <div className="flex justify-between text-[8px] font-black font-mono text-cyan-400 mb-2 uppercase tracking-widest">
                                        <span>φ_Zero</span>
                                        <span>φ_PI</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={phaseShift} onChange={e => setPhaseShift(Number(e.target.value))} className="w-full custom-range" />
                                </div>
                            )}
                        </>
                    )
                }}>
                <svg width="100%" height="100%" viewBox="0 0 256 192" className="overflow-visible opacity-20">
                    <path d="M 64 96 L 128 32 L 192 32 L 192 96" stroke="white" strokeWidth="1" fill="none" /> 
                    <path d="M 64 96 L 128 160 L 192 160 L 192 96" stroke="white" strokeWidth="1" fill="none" />
                    <path d="M 16 96 L 64 96" stroke="white" strokeWidth="1" />
                    <path d="M 192 96 L 256 96" stroke="white" strokeWidth="1" />
                    <rect x="56" y="88" width="16" height="16" fill="white" opacity="0.1" transform="rotate(45 64 96)" />
                    <rect x="184" y="88" width="16" height="16" fill="white" opacity="0.1" transform="rotate(45 192 96)" /> 
                </svg>
            </AnimatedGateDiagram>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <Card className="p-8 bg-gray-950 border-white/5 hover:border-cyan-400/30 transition-all shadow-xl group">
            <h3 className="text-sm font-black text-cyan-400 mb-4 font-orbitron uppercase tracking-widest italic group-hover:translate-x-1 transition-transform">Swastika Invariance</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
                The logic manifold enforces 90-degree rotational symmetry post-computation. 
                This prevents information drift and ensures logic clusters maintain spatial coherence 
                under arbitrary physical orientations, a mandate of the Cyclario 3D architecture.
            </p>
        </Card>
        <Card className="p-8 bg-gray-950 border-white/5 hover:border-pink-400/30 transition-all shadow-xl group">
            <h3 className="text-sm font-black text-pink-400 mb-4 font-orbitron uppercase tracking-widest italic group-hover:translate-x-1 transition-transform">Unitary Reversibility</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
                Our gates utilize dual-rail waveguide swaps (RSWAP) which have no theoretical 
                information loss. By avoiding dissipative CMOS-style logic, we aim for a 
                theoretical energy floor limited only by thermal background fluctuations.
            </p>
        </Card>
        <Card className="p-8 bg-gray-950 border-white/5 hover:border-yellow-400/30 transition-all shadow-xl group">
            <h3 className="text-sm font-black text-yellow-400 mb-4 font-orbitron uppercase tracking-widest italic group-hover:translate-x-1 transition-transform">Light-Speed Latency</h3>
            <p className="text-[11px] text-gray-500 leading-relaxed font-mono">
                Signals propagate through the 3D stack at the group velocity of light in silicon (c/3.4). 
                Clock cycles are eliminated in favor of asynchronous, event-driven propagation, enabling 
                logic results in the low picosecond range per stack depth.
            </p>
        </Card>
      </div>
    </div>
  );
};

export default PhysicsExplorer;
