import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  AgentConfig,
  BiasConfig,
  CustomAgent,
  Neighbor,
  SaveModeString,
} from "@/lib/types";

// --- State Definitions ---

// State for the Standard Simulation Form
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
  initialConfidence: number;
}

// State for the Custom Simulation Form
interface CustomFormState {
  stopThreshold: number;
  iterationLimit: number;
  saveMode: number;
  networkName: string;
  agents: CustomAgent[];
  neighbors: Neighbor[];
}

// Combined state for the entire context
interface SimulationState {
  standardForm: StandardFormState;
  customForm: CustomFormState;

  // Setters
  setStandardForm: Dispatch<SetStateAction<StandardFormState>>;
  setCustomForm: Dispatch<SetStateAction<CustomFormState>>;
  resetState: () => void;
}

// --- Context and Provider ---

const SimulationStateContext = createContext<SimulationState | undefined>(
  undefined,
);
const LOCAL_STORAGE_KEY = "simulationFormState";

// Define the default empty/initial state
const getDefaultState = (): {
  standardForm: StandardFormState;
  customForm: CustomFormState;
} => ({
  standardForm: {
    formValues: {
      numNetworks: 1,
      numAgents: 10,
      density: 5,
      iterationLimit: 100,
      stopThreshold: 0.01,
      saveMode: "Debug" as SaveModeString,
      seed: undefined,
    },
    agentConfigs: [
      {
        id: "default-agent",
        type: "Majority",
        effect: "Memoryless",
        count: 10,
      },
    ],
    biasConfigs: [{ id: "default-bias", bias: "DeGroot", count: 0 }],
    thresholdValue: 0.5,
    thresholdValueConfidence: 0.5,
    initialConfidence: 100,
  },
  customForm: {
    stopThreshold: 0.0001,
    iterationLimit: 100,
    saveMode: 1,
    networkName: "Custom Network",
    agents: [
      {
        id: crypto.randomUUID(),
        name: "Agent 1",
        initialBelief: 0.5,
        toleranceRadius: 0.3,
        toleranceOffset: 0.1,
        silenceStrategy: 0,
        silenceEffect: 0,
        thresholdValue: 0.5,
        confidenceValue: 0.5,
        updateValue: 1,
      },
    ],
    neighbors: [],
  },
});

// Create the Provider Component
export const SimulationStateProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const loadState = () => {
    try {
      const storedState = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedState) {
        const parsed = JSON.parse(storedState, (key, value) => {
          if (key === "seed" && value !== null && value !== undefined) {
            return BigInt(value);
          }
          return value;
        });
        const defaults = getDefaultState();
        // Deep merge to prevent crashes if the stored shape is outdated
        return {
          standardForm: {
            ...defaults.standardForm,
            ...parsed.standardForm,
            formValues: {
              ...defaults.standardForm.formValues,
              ...(parsed.standardForm?.formValues || {}),
            },
          },
          customForm: { ...defaults.customForm, ...(parsed.customForm || {}) },
        };
      }
    } catch (error) {
      console.error("Failed to parse state from localStorage", error);
    }
    return getDefaultState();
  };

  const [standardForm, setStandardForm] = useState(loadState().standardForm);
  const [customForm, setCustomForm] = useState(loadState().customForm);

  useEffect(() => {
    const stateToStore = { standardForm, customForm };
    const serializedState = JSON.stringify(stateToStore, (_key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    );
    localStorage.setItem(LOCAL_STORAGE_KEY, serializedState);
  }, [standardForm, customForm]);

  const resetState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    const defaults = getDefaultState();
    setStandardForm(defaults.standardForm);
    setCustomForm(defaults.customForm);
  };

  const value = {
    standardForm,
    customForm,
    setStandardForm,
    setCustomForm,
    resetState,
  };

  return (
    <SimulationStateContext.Provider value={value}>
      {children}
    </SimulationStateContext.Provider>
  );
};

// Create the custom hook for easy consumption
export const useSimulationState = () => {
  const context = useContext(SimulationStateContext);
  if (context === undefined) {
    throw new Error(
      "useSimulationState must be used within a SimulationStateProvider",
    );
  }
  return context;
};
