import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { AgentConfig, BiasConfig, SaveModeString, CustomAgent, Neighbor } from '@/lib/types'; 

// --- State Definitions ---
interface StandardFormState {
    formValues: {
        seed?: bigint;
        numNetworks: number;
        numAgents: number;
        density: number;
        iterationLimit: number;
        stopThreshold: number;
        saveMode: SaveModeString;
    };
    agentConfigs: AgentConfig[];
    biasConfigs: BiasConfig[];
    thresholdValue: number;
    thresholdValueConfidence: number;
    openMindedness: number;
}

interface CustomFormState {
    stopThreshold: number;
    iterationLimit: number;
    saveMode: number;
    networkName: string;
    agents: CustomAgent[];
    neighbors: Neighbor[];
}

// --- Combined State and Context ---
interface SimulationState {
  standardForm: StandardFormState;
  customForm: CustomFormState;
  lastOpenedForm: 'standard' | 'custom'; // ADDED: To track the last active tab
  
  // Setters
  setStandardForm: Dispatch<SetStateAction<StandardFormState>>;
  setCustomForm: Dispatch<SetStateAction<CustomFormState>>;
  setLastOpenedForm: Dispatch<SetStateAction<'standard' | 'custom'>>; // ADDED
  resetState: () => void;
}

const SimulationStateContext = createContext<SimulationState | undefined>(undefined);
const LOCAL_STORAGE_KEY = 'simulationFormState';

const getDefaultState = (): Omit<SimulationState, 'setStandardForm' | 'setCustomForm' | 'setLastOpenedForm' | 'resetState'> => ({
  standardForm: {
    formValues: {
        numNetworks: 1, numAgents: 10, density: 5, iterationLimit: 100, stopThreshold: 0.01,
        saveMode: 'Debug' as SaveModeString, seed: undefined,
    },
    agentConfigs: [{ id: "default-agent", type: "Majority", effect: "Memoryless", count: 10 }],
    biasConfigs: [{ id: "default-bias", bias: "DeGroot", count: 0 }],
    thresholdValue: 0.5, thresholdValueConfidence: 0.5, openMindedness: 100,
  },
  customForm: {
    stopThreshold: 0.0001, iterationLimit: 100, saveMode: 1, networkName: "Custom Network",
    agents: [{
        id: crypto.randomUUID(), name: "Agent 1", initialBelief: 0.5, toleranceRadius: 0.3,
        toleranceOffset: 0.1, silenceStrategy: 0, silenceEffect: 0,
        thresholdValue: 0.5, confidenceValue: 0.5, updateValue: 1
    }],
    neighbors: [],
  },
  lastOpenedForm: 'standard', // ADDED: Default to standard form
});

export const SimulationStateProvider = ({ children }: { children: ReactNode }) => {
  const loadState = () => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        const parsed = JSON.parse(storedState, (key, value) => (key === 'seed' && value ? BigInt(value) : value));
        const defaults = getDefaultState();
        return {
            standardForm: { ...defaults.standardForm, ...(parsed.standardForm || {}), formValues: { ...defaults.standardForm.formValues, ...(parsed.standardForm?.formValues || {}) } },
            customForm: { ...defaults.customForm, ...(parsed.customForm || {}) },
            lastOpenedForm: parsed.lastOpenedForm || defaults.lastOpenedForm // ADDED
        };
      }
    } catch (error) { console.error("Failed to parse state from localStorage", error); }
    return getDefaultState();
  };

  const [standardForm, setStandardForm] = useState(loadState().standardForm);
  const [customForm, setCustomForm] = useState(loadState().customForm);
  const [lastOpenedForm, setLastOpenedForm] = useState(loadState().lastOpenedForm); // ADDED

  useEffect(() => {
    const stateToStore = { standardForm, customForm, lastOpenedForm }; // ADDED
    const serializedState = JSON.stringify(stateToStore, (key, value) => (typeof value === 'bigint' ? value.toString() : value));
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  }, [standardForm, customForm, lastOpenedForm]); // ADDED

  const resetState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const defaults = getDefaultState();
    setStandardForm(defaults.standardForm);
    setCustomForm(defaults.customForm);
    setLastOpenedForm(defaults.lastOpenedForm); // ADDED
  };

  const value = {
    standardForm, customForm, lastOpenedForm, // ADDED
    setStandardForm, setCustomForm, setLastOpenedForm, // ADDED
    resetState,
  };

  return (
    <SimulationStateContext.Provider value={value}>
      {children}
    </SimulationStateContext.Provider>
  );
};

export const useSimulationState = () => {
  const context = useContext(SimulationStateContext);
  if (context === undefined) { throw new Error('useSimulationState must be used within a SimulationStateProvider'); }
  return context;
};
