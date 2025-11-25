import { usePermissions } from "@/hooks/usePermissions";
import { AgentConfig, BiasConfig, CustomAgent, Neighbor } from "@/lib/types";

const AGENT_COL = {
  NAME: 1, BELIEF: 2, RADIUS: 3, OFFSET: 4, STRAT: 5, EFFECT: 6, THRESH: 7, CONF: 8, UPDATE: 9
};
const EDGE_COL = { SOURCE: 1, TARGET: 2, INFL: 3, BIAS: 4 };

export const useCsvIO = () => {
  const { limits } = usePermissions();

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // --- STANDARD SIMULATION ---

  const exportStandardParams = (
    formValues: any, 
    agentConfigs: AgentConfig[], 
    biasConfigs: BiasConfig[]
  ) => {
    const rows = [["Section", "Key", "Value", "Count"]];

    // Scalar Params
    Object.entries(formValues).forEach(([key, val]) => {
      // FIX: Ensure we don't write "undefined" or "null" strings to CSV
      let displayVal = val;
      if (val === undefined || val === null || val === "undefined") {
        displayVal = "";
      }
      rows.push(["PARAM", key, String(displayVal), ""]);
    });

    // Agents
    agentConfigs.forEach((c) => {
      rows.push(["AGENT", c.type, c.effect, String(c.count)]);
    });

    // Biases
    biasConfigs.forEach((c) => {
      rows.push(["BIAS", c.bias, "", String(c.count)]);
    });

    const csvContent = rows.map((e) => e.join(",")).join("\n");
    downloadCsv(csvContent, `standard_config_${Date.now()}.csv`);
  };

  const parseStandardCsv = async (file: File): Promise<any> => {
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    const newFormValues: any = {};
    const newAgentConfigs: AgentConfig[] = [];
    const newBiasConfigs: BiasConfig[] = [];
    let totalAgents = 0;

    // Skip header
    for (let i = 1; i < lines.length; i++) {
      // Split by comma and trim parts
      const parts = lines[i].split(",").map(s => s.trim());
      const section = parts[0];
      const key = parts[1];
      const val = parts[2];
      const count = parts[3];
      
      if (section === "PARAM") {
        if (key === "seed") {
           // FIX: Special handling for seed
           // 1. Don't use Number() (preserves BigInt precision)
           // 2. Convert "undefined"/"null"/empty to real undefined
           if (!val || val.toLowerCase() === "undefined" || val.toLowerCase() === "null") {
             newFormValues[key] = undefined; 
           } else {
             // Keep as string so the Form component can convert to BigInt safely
             newFormValues[key] = val; 
           }
        } else {
           // Standard number parsing for other params
           if (!val || val.toLowerCase() === "undefined" || val.toLowerCase() === "null") {
              newFormValues[key] = undefined;
           } else {
              newFormValues[key] = isNaN(Number(val)) ? val : Number(val);
           }
        }
      } else if (section === "AGENT") {
        const c = parseInt(count) || 0;
        totalAgents += c;
        newAgentConfigs.push({
          id: `agent-imported-${i}`,
          type: key as any,
          effect: val as any,
          count: c
        });
      } else if (section === "BIAS") {
        newBiasConfigs.push({
          id: `bias-imported-${i}`,
          bias: key as any,
          count: parseInt(count) || 0
        });
      }
    }

    // --- PERMISSION CHECKS ---
    if (isFinite(limits.maxAgents) && (newFormValues.numAgents > limits.maxAgents || totalAgents > limits.maxAgents)) {
      throw new Error(`Import exceeds agent limit of ${limits.maxAgents}`);
    }
    if (isFinite(limits.maxIterations) && newFormValues.iterationLimit > limits.maxIterations) {
      throw new Error(`Import exceeds iteration limit of ${limits.maxIterations}`);
    }

    return { formValues: newFormValues, agentConfigs: newAgentConfigs, biasConfigs: newBiasConfigs };
  };

  const exportCustomSimulation = (customForm: any) => {
    // Header row explains the max column usage
    const rows = [
      ["TYPE", "Name/Key/Source", "Value/Belief/Target", "Radius/Infl", "Offset/Bias", "Strategy", "Effect", "Thresh", "Conf", "Update"]
    ];

    // 1. Params
    rows.push(["PARAM", "stopThreshold", String(customForm.stopThreshold)]);
    rows.push(["PARAM", "iterationLimit", String(customForm.iterationLimit)]);
    rows.push(["PARAM", "saveMode", String(customForm.saveMode)]);
    rows.push(["PARAM", "networkName", customForm.networkName || "Custom Network"]);

    // 2. Agents
    customForm.agents.forEach((a: any) => {
      rows.push([
        "AGENT",
        a.name,
        String(a.initialBelief),
        String(a.toleranceRadius),
        String(a.toleranceOffset),
        String(a.silenceStrategy),
        String(a.silenceEffect),
        String(a.thresholdValue || 0),
        String(a.confidenceValue || 0),
        String(a.updateValue || 1)
      ]);
    });

    // 3. Neighbors
    customForm.neighbors.forEach((n: any) => {
      rows.push([
        "NEIGHBOR",
        n.source,
        n.target,
        String(n.influence),
        String(n.bias)
      ]);
    });

    const csvContent = rows.map((e) => e.join(",")).join("\n");
    downloadCsv(csvContent, `custom_simulation_${Date.now()}.csv`);
  };

  const parseCustomSimulation = async (file: File): Promise<any> => {
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(l => l);
    
    // Accumulators
    const newParams: any = {};
    const newAgents: CustomAgent[] = [];
    const newNeighbors: Neighbor[] = [];
    
    // Validation Sets
    const agentNames = new Set<string>();

    // Skip Header (i=1)
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(s => s.trim());
      const type = cols[0];

      if (type === "PARAM") {
        const key = cols[1];
        const val = cols[2];
        // Handle numeric vs string params
        if (key === "networkName") newParams[key] = val;
        else newParams[key] = Number(val);
      
      } else if (type === "AGENT") {
        const name = cols[AGENT_COL.NAME];
        if (agentNames.has(name)) throw new Error(`Duplicate agent name found: ${name}`);
        
        agentNames.add(name);
        newAgents.push({
          id: crypto.randomUUID(),
          name: name,
          initialBelief: parseFloat(cols[AGENT_COL.BELIEF]),
          toleranceRadius: parseFloat(cols[AGENT_COL.RADIUS]),
          toleranceOffset: parseFloat(cols[AGENT_COL.OFFSET]),
          silenceStrategy: parseInt(cols[AGENT_COL.STRAT]),
          silenceEffect: parseInt(cols[AGENT_COL.EFFECT]),
          thresholdValue: parseFloat(cols[AGENT_COL.THRESH]) || 0,
          confidenceValue: parseFloat(cols[AGENT_COL.CONF]) || 0,
          updateValue: parseInt(cols[AGENT_COL.UPDATE]) || 1,
        });

      } else if (type === "NEIGHBOR") {
        const source = cols[EDGE_COL.SOURCE];
        const target = cols[EDGE_COL.TARGET];

        // VALIDATION: Ensure edge connects existing agents
        // We can check this now because we process the file sequentially, 
        // assuming AGENT rows come before NEIGHBOR rows. 
        // If file is unordered, we would need to do this check after the loop.
        
        newNeighbors.push({
          id: crypto.randomUUID(),
          source: source,
          target: target,
          influence: parseFloat(cols[EDGE_COL.INFL]),
          bias: parseInt(cols[EDGE_COL.BIAS])
        });
      }
    }

    // Post-loop Validation
    if (isFinite(limits.maxAgents) && newAgents.length > limits.maxAgents) {
      throw new Error(`Import exceeds agent limit of ${limits.maxAgents}`);
    }

    // Verify all neighbors point to valid agents
    newNeighbors.forEach(n => {
       if (!agentNames.has(n.source) || !agentNames.has(n.target)) {
         throw new Error(`Invalid neighbor connection: ${n.source} -> ${n.target}. Agent not found.`);
       }
    });

    return { 
      ...newParams, 
      agents: newAgents, 
      neighbors: newNeighbors 
    };
  };

  return {
    // ... standard exports
    exportStandardParams,
    parseStandardCsv,
    // ... new unified custom exports
    exportCustomSimulation,
    parseCustomSimulation
  };
};