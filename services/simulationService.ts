
import { 
    TileState, 
    Lattice3D, 
    MasterGateType,
    ThermalLattice3D,
    BASE_LATENCIES,
    THERMAL_ALPHA,
    THERMAL_BETA,
    THERMAL_GAMMA,
    THERMAL_KAPPA,
    EngineConfig,
    MetricSet
} from '../types';

const SIZE_X = 9;
const SIZE_Y = 9;
const SIZE_Z = 6;

// --- Micro Kernel Operations (The Native DSL Building Blocks) ---
const microThreshold = (neighbors: TileState[], count: number): TileState => {
  if (count === 0) return [0, 1];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += neighbors[i][0];
  }
  return sum / count > 0.5 ? [1, 0] : [0, 1];
};

const microXOR = (neighbors: TileState[], count: number): TileState => {
  let x0 = 0, x1 = 0;
  for (let i = 0; i < count; i++) {
    x0 ^= neighbors[i][0];
    x1 ^= neighbors[i][1];
  }
  return [x0, x1];
};

const microMemory = (neighbors: TileState[], count: number, self: TileState): TileState => {
    if (count === 0) return self;
    let sum = 0;
    for (let i = 0; i < count; i++) sum += neighbors[i][0];
    return sum > count / 2 ? [1 - self[0], 1 - self[1]] : self;
};

const microNOT = (self: TileState): TileState => [1 - self[0], 1 - self[1]];

// --- Master Gate Layer ---
const masterIdentity = (tile: TileState): TileState => tile;
const masterNOT = (tile: TileState): TileState => [1 - tile[0], 1 - tile[1]];
const masterXOR = (tile: TileState): TileState => [tile[0] ^ tile[1], tile[1]];
const masterThreshold = (tile: TileState): TileState => (tile[0] + tile[1] > 1 ? [1,0] : [0,1]);

const quantize3D = (value: number): number => (value >= 0.5 ? 1 : 0);

// --- Protection Functional: Chaotic Scrambler (IP Protection) ---
const applyScrambleFunctional = (tile: TileState): TileState => {
    const seed = Math.random();
    if (seed < 0.05) return [tile[1], tile[0]];
    if (seed < 0.10) return [1 - tile[0], 1 - tile[1]];
    return tile;
};

export const initializeLattice3D = (): Lattice3D => {
  return Array.from({ length: SIZE_Z }, () =>
    Array.from({ length: SIZE_X }, () =>
      Array.from({ length: SIZE_Y }, () =>
        (Math.random() > 0.5 ? [1, 0] : [0, 1])
      )
    )
  );
};

export const initializeThermalLattice3D = (): ThermalLattice3D => {
  return Array.from({ length: SIZE_Z }, () => 
    Array.from({ length: SIZE_X }, () => Array(SIZE_Y).fill(0))
  );
};

const getNeighbors3D = (lattice: Lattice3D, x: number, y: number, z: number, buffer: TileState[]): number => {
  let count = 0;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        if (dx === 0 && dy === 0 && dz === 0) continue;
        const nz = (z + dz + SIZE_Z) % SIZE_Z; 
        const nx = (x + dx + SIZE_X) % SIZE_X; 
        const ny = (y + dy + SIZE_Y) % SIZE_Y; 
        buffer[count++] = lattice[nz][nx][ny];
      }
    }
  }
  return count;
};

// --- Symbolic Geometry Constraint (sigma) ---
const applySwastikaSymmetryMap = (input: Lattice3D, output: Lattice3D, workspace: { rotatedLayer: TileState[][] }): void => {
  for(let z = 0; z < SIZE_Z; z++) {
      const layer = input[z];
      for (let i = 0; i < SIZE_X; i++) {
          for (let j = 0; j < SIZE_Y; j++) {
              workspace.rotatedLayer[i][j] = layer[SIZE_Y - 1 - j][i];
          }
      }
      for (let i = 0; i < SIZE_X; i++) {
          for (let j = 0; j < SIZE_Y; j++) {
              const original = layer[i][j];
              const rotated = workspace.rotatedLayer[i][j];
              output[z][i][j][0] = original[0] ^ rotated[0];
              output[z][i][j][1] = original[1] ^ rotated[1];
          }
      }
  }
};

export interface SimulationWorkspace {
    hLattice: Lattice3D;
    unquantizedLattice: Lattice3D;
    symmetryWorkspace: { rotatedLayer: TileState[][] };
    zSums: TileState[];
    neighborBuffer: TileState[];
}

export const createWorkspace = (): SimulationWorkspace => ({
    hLattice: initializeLattice3D(),
    unquantizedLattice: initializeLattice3D(),
    symmetryWorkspace: {
        rotatedLayer: Array.from({ length: SIZE_X }, () => Array(SIZE_Y).fill([0, 0] as TileState))
    },
    zSums: Array.from({ length: SIZE_X * SIZE_Y }, () => [0, 0]),
    neighborBuffer: Array(26),
});

export const step = (
  currentLattice: Lattice3D,
  currentThermalLattice: ThermalLattice3D,
  nextLattice: Lattice3D,
  nextThermalLattice: ThermalLattice3D,
  config: EngineConfig,
  workspace: SimulationWorkspace
): { metrics: MetricSet } => {
  const { metaKernel, masterGate, enforceSymmetry } = config.logic;
  const { hLattice, unquantizedLattice, symmetryWorkspace, zSums, neighborBuffer } = workspace;

  // 1. Level 1: Micro-Kernel (Local Spiking logic)
  for (let z = 0; z < SIZE_Z; z++) {
    for (let i = 0; i < SIZE_X; i++) {
      for (let j = 0; j < SIZE_Y; j++) {
        const neighborCount = getNeighbors3D(currentLattice, i, j, z, neighborBuffer);
        const self = currentLattice[z][i][j];
        const kw = metaKernel[i % 3][j % 3];

        let res: TileState;
        switch (kw) {
            case 3: res = microXOR(neighborBuffer, neighborCount); break;
            case 4: res = microThreshold(neighborBuffer, neighborCount); break;
            case 5: res = microMemory(neighborBuffer, neighborCount, self); break;
            case 6: res = microNOT(self); break;
            default: res = self; break;
        }
        hLattice[z][i][j] = applyScrambleFunctional(res);
      }
    }
  }

  // 2. Dimensional Stacking (Dimensional Scaling along Z)
  for (let k = 0; k < zSums.length; k++) { zSums[k][0] = 0; zSums[k][1] = 0; }
  for (let i = 0; i < SIZE_X; i++) {
    for (let j = 0; j < SIZE_Y; j++) {
      const zs = zSums[i * SIZE_Y + j];
      for (let z = 0; z < SIZE_Z; z++) {
        zs[0] += hLattice[z][i][j][0];
        zs[1] += hLattice[z][i][j][1];
      }
    }
  }

  // 3. Level 2: Master Gate & Columnar Parity
  for (let z = 0; z < SIZE_Z; z++) {
    for (let i = 0; i < SIZE_X; i++) {
      for (let j = 0; j < SIZE_Y; j++) {
        const zs = zSums[i * SIZE_Y + j];
        const par = ((zs[0] + zs[1]) % 2) !== 0;
        const inp = hLattice[z][i][j];
        
        let out: TileState;
        switch(masterGate) {
            case MasterGateType.NOT: out = masterNOT(inp); break;
            case MasterGateType.XOR: out = masterXOR(inp); break;
            case MasterGateType.THRESHOLD: out = masterThreshold(inp); break;
            default: out = masterIdentity(inp); break;
        }
        unquantizedLattice[z][i][j] = par ? masterNOT(out) : out;
      }
    }
  }

  // 4. Level 3: Swastika Symmetrical Folding (Geometric Enforcement)
  if (enforceSymmetry) {
    applySwastikaSymmetryMap(unquantizedLattice, hLattice, symmetryWorkspace);
  } else {
    for(let z=0;z<SIZE_Z;z++) for(let i=0;i<SIZE_X;i++) for(let j=0;j<SIZE_Y;j++) hLattice[z][i][j] = unquantizedLattice[z][i][j];
  }

  // 5. Integration & Metrics
  let lat = 0, chg = 0, del = 0, eng = 0, therm = 0, rev = 0, flux = 0;
  for (let z = 0; z < SIZE_Z; z++) {
    for (let i = 0; i < SIZE_X; i++) {
      for (let j = 0; j < SIZE_Y; j++) {
        const target = hLattice[z][i][j];
        const old = currentLattice[z][i][j];
        const next: TileState = [quantize3D(target[0]), quantize3D(target[1])];

        const switched = old[0] !== next[0] || old[1] !== next[1];
        const temp = currentThermalLattice[z][i][j];
        const newTemp = THERMAL_BETA * temp + (switched ? THERMAL_GAMMA : 0);
        
        nextThermalLattice[z][i][j] = Math.max(0, Math.min(2, newTemp));
        nextLattice[z][i][j] = next;

        lat += BASE_LATENCIES[masterGate] * (1 + THERMAL_ALPHA * temp);
        if (switched) chg++;
        eng += next[0] + next[1];
        // Reversibility check: logic difference from inverse
        rev += (next[0] ^ old[0]) + (next[1] ^ old[1]);
        therm += newTemp;
        flux += (next[0] * 1.5) + (next[1] * 0.5); // Differential weighted flux
      }
    }
  }

  const total = SIZE_X * SIZE_Y * SIZE_Z;
  return {
    metrics: {
        avgLatency: lat / total,
        logicChange: chg / total,
        deltaSymmetry: Math.sqrt(unquantizedLattice.flat(2).reduce((s, t) => s + t[0] + t[1], 0)),
        delta: chg,
        energy: eng / (total * 2),
        thermalStability: 1 - (therm / total),
        energyConsumption: (eng / total) + (chg / total * 0.4),
        reversibilityError: rev / (total * 2),
        unitaryFlux: flux / total
    }
  };
};
