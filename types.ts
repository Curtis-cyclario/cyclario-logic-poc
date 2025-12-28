
export type TileState = [number, number]; // [c0, c1] - Dual-rail binary logic

export type Lattice2D = TileState[][];
export type ThermalLattice = number[][];

export type Lattice3D = Lattice2D[];
export type ThermalLattice3D = ThermalLattice[];

export type MetaKernel = number[][];

export interface TensorPatch {
    z: number;
    rStart: number;
    cStart: number;
    size: number;
}

export enum MasterGateType {
  IDENTITY = 'IDENTITY',
  NOT = 'NOT',
  XOR = 'XOR',
  THRESHOLD = 'THRESHOLD',
}

export enum MasterMode {
  CONSUMER = 'CONSUMER', 
  PHYSXZARD = 'PHYSXZARD', 
  CINEMATIC = 'CINEMATIC', 
}

export const BASE_LATENCIES: { [key in MasterGateType]: number } = {
  [MasterGateType.IDENTITY]: 2,
  [MasterGateType.NOT]: 3,
  [MasterGateType.XOR]: 5,
  [MasterGateType.THRESHOLD]: 8,
};

// Thermal constants
export const THERMAL_ALPHA = 0.01; 
export const THERMAL_GAMMA = 0.05; 
export const THERMAL_BETA = 0.95;  
export const THERMAL_KAPPA = 0.1;  

export enum ActiveView {
  SIMULATION = 'SIMULATION',
  PHYSICS = 'PHYSICS',
  PONG = 'PONG',
  TELEMETRIC_ROVER = 'TELEMETRIC_ROVER',
}

export interface EngineConfig {
  logic: {
    masterGate: MasterGateType;
    metaKernel: MetaKernel;
    enforceSymmetry: boolean;
  };
  physics: {
    noiseLevel: number;
  };
  display: {
    masterMode: MasterMode;
  };
}

export interface MetricSet {
    avgLatency: number;
    logicChange: number;
    deltaSymmetry: number;
    delta: number;
    energy: number;
    thermalStability: number;
    energyConsumption: number;
    reversibilityError: number; 
    unitaryFlux: number; 
}
