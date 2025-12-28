
import { useState, useEffect } from 'react';
import { SimulationEngine, SimulationState } from '../services/simulationEngine';

export const useSimulation = (engine: SimulationEngine): SimulationState => {
    // Get initial state safely without side-effects in the initializer,
    // using the existing getFullState method which returns a deep copy.
    const [state, setState] = useState<SimulationState>(() => engine.getFullState());

    useEffect(() => {
        const handleStateChange = (newState: SimulationState) => {
            setState(newState);
        };

        engine.subscribe(handleStateChange);

        return () => {
            engine.unsubscribe(handleStateChange);
        };
    }, [engine]);

    return state;
};
