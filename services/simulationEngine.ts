
import {
    Lattice3D,
    TileState,
    ThermalLattice3D,
    EngineConfig,
    MasterGateType,
    MetaKernel,
    MetricSet,
    MasterMode
} from '../types';
import {
    initializeLattice3D,
    initializeThermalLattice3D,
    createWorkspace,
    step,
    SimulationWorkspace,
} from './simulationService';

const MAX_HISTORY = 100;
const STORAGE_KEY = 'cyclario_simulation_state';

export interface SimulationState {
    lattice: Lattice3D;
    thermalLattice: ThermalLattice3D;
    metrics: MetricSet;
    metricsHistory: MetricSet[];
    config: EngineConfig;
    isRunning: boolean;
}

const DEFAULT_META_KERNEL: MetaKernel = [
    [3, 4, 3],
    [5, 6, 5],
    [3, 4, 3],
];

export class SimulationEngine {
    private state: SimulationState;
    private workspace: SimulationWorkspace;
    private nextLattice: Lattice3D;
    private nextThermalLattice: ThermalLattice3D;
    private animationFrameId: number | null = null;
    private listeners: Set<(state: SimulationState) => void> = new Set();

    constructor() {
        this.workspace = createWorkspace();
        this.nextLattice = initializeLattice3D();
        this.nextThermalLattice = initializeThermalLattice3D();
        
        const saved = this.loadState();
        
        this.state = saved || {
            lattice: initializeLattice3D(),
            thermalLattice: initializeThermalLattice3D(),
            metrics: {
                avgLatency: 0,
                logicChange: 0,
                deltaSymmetry: 0,
                delta: 0,
                energy: 0,
                thermalStability: 0,
                energyConsumption: 0,
                reversibilityError: 0,
                unitaryFlux: 0,
            },
            metricsHistory: [],
            config: {
                logic: {
                    masterGate: MasterGateType.XOR,
                    metaKernel: DEFAULT_META_KERNEL,
                    enforceSymmetry: true,
                },
                physics: {
                    noiseLevel: 0.01,
                },
                display: {
                    masterMode: MasterMode.CINEMATIC,
                }
            },
            isRunning: false,
        };
    }

    private tick = () => {
        const { metrics } = step(
            this.state.lattice,
            this.state.thermalLattice,
            this.nextLattice,
            this.nextThermalLattice,
            this.state.config,
            this.workspace
        );

        this.state.lattice = this.nextLattice;
        this.state.thermalLattice = this.nextThermalLattice;
        this.nextLattice = initializeLattice3D(); 
        this.nextThermalLattice = initializeThermalLattice3D();

        this.state.metrics = metrics;
        this.state.metricsHistory.push(metrics);
        if (this.state.metricsHistory.length > MAX_HISTORY) this.state.metricsHistory.shift();
        
        this.notify();
        this.saveState();
        if (this.state.isRunning) this.animationFrameId = requestAnimationFrame(this.tick);
    };
    
    private saveState() {
        try {
            const persistentState = {
                ...this.state,
                isRunning: false, // Don't persist running state
                metricsHistory: [] // History might be too large for localStorage, keeping it transient
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
        } catch (e) {
            console.warn("Could not save state to localStorage:", e);
        }
    }

    private loadState(): SimulationState | null {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    public subscribe = (listener: (state: SimulationState) => void) => { 
        this.listeners.add(listener); 
        listener(this.state); 
    };
    
    public unsubscribe = (listener: (state: SimulationState) => void) => { 
        this.listeners.delete(listener); 
    };

    private notify = () => {
        const stateCopy = { ...this.state, metricsHistory: [...this.state.metricsHistory] };
        for (const listener of this.listeners) listener(stateCopy);
    };
    
    public run = () => { 
        if (this.state.isRunning) return; 
        this.state.isRunning = true; 
        this.animationFrameId = requestAnimationFrame(this.tick); 
        this.notify(); 
    };

    public pause = () => { 
        if (!this.state.isRunning) return; 
        this.state.isRunning = false; 
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId); 
        this.animationFrameId = null; 
        this.notify(); 
        this.saveState();
    };

    public toggleRun = () => this.state.isRunning ? this.pause() : this.run();
    
    public reset = () => { 
        this.pause(); 
        this.state.lattice = initializeLattice3D(); 
        this.state.thermalLattice = initializeThermalLattice3D(); 
        this.state.metricsHistory = []; 
        this.notify(); 
        this.saveState();
    };
    
    public updateConfig = (newConfig: Partial<EngineConfig>) => {
        this.state.config = {
            ...this.state.config,
            ...newConfig,
            logic: { ...this.state.config.logic, ...newConfig.logic },
            physics: { ...this.state.config.physics, ...newConfig.physics },
            display: { ...this.state.config.display, ...newConfig.display }
        };
        this.notify();
        this.saveState();
    };

    public toggleTileState = (z: number, x: number, y: number) => {
        if (this.state.isRunning) return;
        const currentTile = this.state.lattice[z][x][y];
        this.state.lattice[z][x][y] = [1 - currentTile[0], 1 - currentTile[1]];
        this.notify();
        this.saveState();
    }

    public rotateKernel = () => {
        const old = this.state.config.logic.metaKernel;
        const n = 3;
        const next = [[0,0,0],[0,0,0],[0,0,0]];
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) next[i][j] = old[n - 1 - j][i];
        this.updateConfig({ logic: { ...this.state.config.logic, metaKernel: next } });
    }

    public flipKernel = () => {
        const flipped = this.state.config.logic.metaKernel.map(row => [...row].reverse());
        this.updateConfig({ logic: { ...this.state.config.logic, metaKernel: flipped } });
    }

    public getFullState = (): SimulationState => JSON.parse(JSON.stringify(this.state));
}
