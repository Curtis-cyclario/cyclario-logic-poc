
import React, { useState, useMemo, useEffect } from 'react';

// --- Constants ---
const C = 299792458; // Speed of light in m/s
const H = 6.62607015e-34; // Planck's constant in J·s
const EV_CONVERSION = 6.242e18; // Joules to electronvolts

const LOG_WAVELENGTH_MAX = 4; // 10^4 m (Radio)
const LOG_WAVELENGTH_MIN = -15; // 10^-15 m (Gamma)
const LOG_WAVELENGTH_SPAN = LOG_WAVELENGTH_MAX - LOG_WAVELENGTH_MIN;

// Derived frequency bounds
const LOG_FREQ_MIN = Math.log10(C / Math.pow(10, LOG_WAVELENGTH_MAX));
const LOG_FREQ_MAX = Math.log10(C / Math.pow(10, LOG_WAVELENGTH_MIN));
const LOG_FREQ_SPAN = LOG_FREQ_MAX - LOG_FREQ_MIN;

const SPECTRUM_DATA = [
  { name: 'Gamma Ray', min: -Infinity, max: 1e-11, description: 'Highest energy photons. Capable of ionizing atoms and damaging DNA.', color: 'bg-blue-800', glow: 'rgba(30, 58, 138, 0.5)' },
  { name: 'X-Ray', min: 1e-11, max: 1e-8, description: 'High energy. Used for interior imaging of opaque objects.', color: 'bg-indigo-700', glow: 'rgba(67, 56, 202, 0.5)' },
  { name: 'Ultraviolet', min: 1e-8, max: 3.8e-7, description: 'Shorter than visible light. Causes fluorescence in many materials.', color: 'bg-purple-600', glow: 'rgba(147, 51, 234, 0.5)' },
  { name: 'Visible', min: 3.8e-7, max: 7.5e-7, description: 'The narrow window where our biology interprets electromagnetic waves as color.', color: 'bg-gradient-to-r from-violet-500 via-green-500 to-red-500', glow: 'rgba(34, 197, 94, 0.5)' },
  { name: 'Infrared', min: 7.5e-7, max: 1e-3, description: 'Thermal radiation. Key for environmental sensing and fiber communication.', color: 'bg-red-500', glow: 'rgba(239, 68, 68, 0.5)' },
  { name: 'Microwave', min: 1e-3, max: 1e-1, description: 'Used for rotational spectroscopy and high-speed data links.', color: 'bg-orange-600', glow: 'rgba(249, 115, 22, 0.5)' },
  { name: 'Radio', min: 1e-1, max: Infinity, description: 'Extremely long waves. Ideal for global broadcasting and deep space links.', color: 'bg-red-900', glow: 'rgba(127, 29, 29, 0.5)' },
];

const SPECTRUM_DATA_FOR_RENDER = [...SPECTRUM_DATA].reverse();

const wavelengthToRgb = (wavelength: number): string => {
  let r = 0, g = 0, b = 0;
  if (wavelength >= 380 && wavelength <= 439) {
    r = -(wavelength - 440) / (440 - 380);
    g = 0;
    b = 1.0;
  } else if (wavelength >= 440 && wavelength <= 489) {
    r = 0;
    g = (wavelength - 440) / (490 - 440);
    b = 1.0;
  } else if (wavelength >= 490 && wavelength <= 509) {
    r = 0;
    g = 1.0;
    b = -(wavelength - 510) / (510 - 490);
  } else if (wavelength >= 510 && wavelength <= 579) {
    r = (wavelength - 510) / (580 - 510);
    g = 1.0;
    b = 0;
  } else if (wavelength >= 580 && wavelength <= 644) {
    r = 1.0;
    g = -(wavelength - 645) / (645 - 580);
    b = 0;
  } else if (wavelength >= 645 && wavelength <= 750) {
    r = 1.0;
    g = 0;
    b = 0;
  }
  let factor = 0;
  if (wavelength >= 380 && wavelength <= 419) factor = 0.3 + 0.7 * (wavelength - 380) / (420 - 380);
  else if (wavelength >= 420 && wavelength <= 644) factor = 1.0;
  else if (wavelength >= 645 && wavelength <= 750) factor = 0.3 + 0.7 * (750 - wavelength) / (750 - 645);
  const intensity = (v: number) => Math.round(255 * (v * factor));
  return `rgb(${intensity(r)}, ${intensity(g)}, ${intensity(b)})`;
};

const InteractiveWaveform: React.FC = () => {
  const [amplitude, setAmplitude] = useState(50);
  const [wavelengthSlider, setWavelengthSlider] = useState(125); // 0-1000
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationFrameId: number;
    const animate = (timestamp: number) => {
      setTime(timestamp * 0.0005);
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const { wavelength, frequency, logWavelength, energyEV } = useMemo(() => {
    const logVal = LOG_WAVELENGTH_MAX - (wavelengthSlider / 1000) * LOG_WAVELENGTH_SPAN;
    const wl = Math.pow(10, logVal);
    const freq = C / wl;
    const energyJ = H * freq;
    return {
      wavelength: wl,
      frequency: freq,
      logWavelength: logVal,
      energyEV: energyJ * EV_CONVERSION
    };
  }, [wavelengthSlider]);

  const frequencySlider = useMemo(() => {
    const logFreq = Math.log10(frequency);
    return ((logFreq - LOG_FREQ_MIN) / LOG_FREQ_SPAN) * 1000;
  }, [frequency]);

  const handleFrequencyChange = (val: number) => {
    const logFreq = LOG_FREQ_MIN + (val / 1000) * LOG_FREQ_SPAN;
    const freq = Math.pow(10, logFreq);
    const wl = C / freq;
    const logWl = Math.log10(wl);
    const newWlSlider = ((LOG_WAVELENGTH_MAX - logWl) / LOG_WAVELENGTH_SPAN) * 1000;
    setWavelengthSlider(newWlSlider);
  };

  const currentSpectrumInfo = useMemo(() => {
    return SPECTRUM_DATA.find(d => wavelength > d.min && wavelength <= d.max) 
            || { name: 'Unknown', description: '', color: '', glow: 'rgba(0,255,255,0.2)' };
  }, [wavelength]);
  
  const waveColor = useMemo(() => {
    const wavelengthNM = wavelength * 1e9;
    if (wavelengthNM >= 380 && wavelengthNM <= 750) {
      return wavelengthToRgb(wavelengthNM);
    }
    // Color coding for outer regions
    if (wavelength < 380e-9) return '#a855f7'; // UV/Gamma Purple
    return '#ef4444'; // IR/Radio Red
  }, [wavelength]);

  const wavePath = useMemo(() => {
    const width = 500;
    const height = 200;
    const centerY = height / 2;
    // Map log wavelength to a visual frequency
    const visualFreq = Math.pow(10, (logWavelength * -1) / 5);
    const phase = time * visualFreq * 5;
    let path = `M 0 ${centerY}`;
    for (let x = 0; x <= width; x++) {
      const angle = (x / width) * Math.PI * 2 * visualFreq;
      const y = centerY - (amplitude / 100) * (height / 2 - 15) * Math.sin(angle + phase);
      path += ` L ${x} ${y.toFixed(2)}`;
    }
    return path;
  }, [amplitude, logWavelength, time]);

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="w-full lg:w-5/12 flex flex-col gap-5">
        <div>
          <h3 className="text-xl font-bold text-cyan-300 mb-1 font-orbitron">Wave Dynamics Explorer</h3>
          <p className="text-sm text-gray-400">Manipulate the fundamental properties of light.</p>
        </div>

        <div className="space-y-5 bg-gray-900/40 p-5 rounded-lg border border-cyan-500/10 shadow-inner">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono uppercase text-gray-400">Amplitude</label>
              <span className="text-xs font-mono text-cyan-400">{amplitude}%</span>
            </div>
            <input type="range" min="0" max="100" value={amplitude} onChange={e => setAmplitude(Number(e.target.value))} className="w-full custom-range"/>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono uppercase text-gray-400">Frequency (f)</label>
              <span className="text-xs font-mono text-cyan-400">{frequency.toExponential(2)} Hz</span>
            </div>
            <input type="range" min="0" max="1000" value={frequencySlider} onChange={e => handleFrequencyChange(Number(e.target.value))} className="w-full custom-range"/>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-xs font-mono uppercase text-gray-400">Wavelength (λ)</label>
              <span className="text-xs font-mono text-pink-400">{wavelength.toExponential(2)} m</span>
            </div>
            <input type="range" min="0" max="1000" value={wavelengthSlider} onChange={e => setWavelengthSlider(Number(e.target.value))} className="w-full custom-range"/>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-black/40 rounded border border-cyan-500/20">
             <p className="text-[10px] text-gray-500 uppercase font-bold">Photon Energy</p>
             <p className="text-lg font-orbitron text-yellow-400">{energyEV < 0.01 ? energyEV.toExponential(2) : energyEV.toFixed(2)} <span className="text-xs font-mono">eV</span></p>
          </div>
          <div className="p-3 bg-black/40 rounded border border-cyan-500/20">
             <p className="text-[10px] text-gray-500 uppercase font-bold">Oscillation Period</p>
             <p className="text-lg font-orbitron text-cyan-400">{(1/frequency).toExponential(1)} <span className="text-xs font-mono">s</span></p>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-7/12 flex flex-col justify-center items-center gap-6">
        {/* Wave Visualization with Dynamic Glow */}
        <div 
          className="w-full h-56 bg-black/80 rounded-xl border-2 border-cyan-800/30 p-1 relative overflow-hidden transition-all duration-500"
          style={{ boxShadow: `0 0 30px -10px ${currentSpectrumInfo.glow || 'rgba(0,255,255,0.2)'}` }}
        >
          <div className="absolute top-2 left-3 z-10">
             <span className="px-2 py-0.5 bg-cyan-900/50 rounded text-[10px] font-bold text-cyan-300 uppercase border border-cyan-500/30">
               {currentSpectrumInfo.name}
             </span>
          </div>
          <svg width="100%" height="100%" viewBox="0 0 500 200" preserveAspectRatio="none">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path d={wavePath} stroke={waveColor} strokeWidth="3" fill="none" filter="url(#glow)" style={{ transition: 'stroke 300ms ease-in-out' }}/>
            {/* Wave center line */}
            <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="5 5" />
          </svg>
        </div>

        {/* Improved Spectrum Bar */}
        <div className="w-full px-2">
            <div className="relative w-full h-10 flex rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                {SPECTRUM_DATA_FOR_RENDER.map(({name, color}) => (
                    <div key={name} title={name} className={`h-full flex-grow ${color} border-r border-black/10`} />
                ))}
                
                {/* Visual Label for Visible region */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className="bg-black/60 px-2 py-0.5 rounded text-[8px] text-white font-bold opacity-0 hover:opacity-100 transition-opacity">Visible Spectrum</div>
                </div>
            </div>

             <div className="relative w-full h-10 flex mt-2">
                {SPECTRUM_DATA_FOR_RENDER.map(({name}) => (
                    <div key={name} className="h-full flex-grow text-center">
                        <span className="text-[10px] text-gray-500 transform -rotate-45 origin-top-left inline-block font-mono font-bold whitespace-nowrap">{name}</span>
                    </div>
                ))}
                {/* Indicator Marker */}
                 <div className="absolute top-[-44px] h-12 w-px transition-all duration-150 z-20" style={{ transform: `translateX(${(wavelengthSlider / 1000) * 100}%)`}}>
                    <div className="w-0.5 h-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full border-2 border-black shadow-[0_0_10px_rgba(250,204,21,1)]"></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveWaveform;
