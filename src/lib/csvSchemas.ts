// src/lib/csvSchemas.ts

// --- STANDARD SIMULATION PATTERN ---
// Structure: Section-based CSV to handle scalar values + lists in one file
// Row format: Type, Key/SubType, Value/Effect, Count/Extra
// Example:
// PARAM, numAgents, 100,
// AGENT, DeGroot, Memory, 50
// BIAS, Confirmation, , 10

export const STANDARD_CSV_HEADERS = ['Section', 'Key', 'Value', 'Count'];

// --- CUSTOM SIMULATION PATTERN ---
// We separate Agents and Topology (Neighbors) as they are distinct entities in graph theory.

export const CUSTOM_AGENT_HEADERS = [
  'name', 'initialBelief', 'toleranceRadius', 'toleranceOffset', 
  'silenceStrategy', 'silenceEffect', 'thresholdValue', 'confidenceValue', 'updateValue'
];

export const CUSTOM_NEIGHBOR_HEADERS = [
  'source', 'target', 'influence', 'bias'
];