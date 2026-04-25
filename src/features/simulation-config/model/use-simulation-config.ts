import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useSimulationStore } from "@/entities/simulation";
import { useAuthStore } from "@/entities/user";
import { simulationsApi } from "@/shared/api/backend";
import { useTranslation } from "@/shared/i18n";
import { isErrorCode } from "@/shared/lib/backend-error";
import {
  BINARY_THRESHOLD_BYTES,
  encodeCustomSimulation,
  estimateJsonSize,
} from "@/shared/lib/custom-simulation-encoder";
import { logger } from "@/shared/lib/logger";
import { customSimSchema, generatedSimSchema } from "../lib/validation";
import type {
  CustomSimFormValues,
  GeneratedSimFormValues,
  SimConfigValidationErrors,
  WizardStep,
} from "../types/simulation-config.types";
import { useSimulationConfigStore } from "./simulation-config.store";

function validateCustomForm(values: CustomSimFormValues): SimConfigValidationErrors {
  const errors: SimConfigValidationErrors = {};
  const result = customSimSchema.safeParse(values);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const msg = issue.message;
      const path = issue.path[0];

      if (msg === "duplicateEdge") {
        errors.customEdgeDuplicate = true;
      } else if (msg === "edgeUnknownAgent") {
        errors.customEdgeUnknownAgent = true;
      } else if (path === "networkName") {
        errors.customNetworkNameEmpty = true;
      } else if (path === "stopThreshold") {
        errors.stopThresholdOutOfRange = true;
      } else if (path === "agents") {
        // min(1) fires at the "agents" root path
        errors.customNoAgents = true;
      } else if (path === "edges") {
        // min(1) fires at the "edges" root path
        errors.customNoEdges = true;
      } else if (typeof path === "string") {
        errors.countsInvalid = true;
      } else {
        // Nested path: agents[i].* or edges[i].*
        const parentKey = issue.path[0];
        if (parentKey === "agents") {
          errors.customAgentInvalid = true;
        } else {
          errors.customEdgeInvalid = true;
        }
      }
    }
  }

  return errors;
}

function validateGeneratedForm(
  values: GeneratedSimFormValues,
  maxAgents: number | undefined,
  maxIterations: number | undefined,
): SimConfigValidationErrors {
  const errors: SimConfigValidationErrors = {};
  const result = generatedSimSchema.safeParse(values);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const msg = issue.message;
      const path = issue.path[0];

      if (msg === "agentCountMismatch") {
        errors.agentCountMismatch = true;
      } else if (msg === "biasCountMismatch") {
        errors.biasCountMismatch = true;
      } else if (path === "stopThreshold") {
        errors.stopThresholdOutOfRange = true;
      } else {
        errors.countsInvalid = true;
      }
    }
  }

  const totalAgents = values.agentTypes.reduce((sum, r) => sum + r.count, 0);

  if (
    maxIterations !== undefined &&
    maxIterations !== null &&
    values.iterationLimit > maxIterations
  ) {
    errors.iterationLimitExceeded = true;
  }

  if (maxAgents !== undefined && maxAgents !== null && totalAgents > maxAgents) {
    errors.agentLimitExceeded = true;
  }

  return errors;
}

function hasErrors(errors: SimConfigValidationErrors): boolean {
  return Object.values(errors).some(Boolean);
}

export function useSimulationConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setRunId = useSimulationStore((s) => s.setRunId);
  const setStatus = useSimulationStore((s) => s.setStatus);
  const user = useAuthStore((s) => s.user);

  const maxAgents = user?.usageLimits?.maxAgents;
  const maxIterations = user?.usageLimits?.maxIterations;

  // Persistent wizard state from store
  const networkType = useSimulationConfigStore((s) => s.networkType);
  const step = useSimulationConfigStore((s) => s.step);
  const generatedValues = useSimulationConfigStore((s) => s.generatedValues);
  const customValues = useSimulationConfigStore((s) => s.customValues);
  const activeTemplate = useSimulationConfigStore((s) => s.activeTemplate);
  const storeSetNetworkType = useSimulationConfigStore((s) => s.setNetworkType);
  const setStep = useSimulationConfigStore((s) => s.setStep);
  const storeUpdateGeneratedValues = useSimulationConfigStore((s) => s.updateGeneratedValues);
  const storeUpdateCustomValues = useSimulationConfigStore((s) => s.updateCustomValues);
  const storeSetActiveTemplate = useSimulationConfigStore((s) => s.setActiveTemplate);
  const storeReset = useSimulationConfigStore((s) => s.reset);

  // Non-persistent local state
  const [errors, setErrors] = useState<SimConfigValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [usageLimitError, setUsageLimitError] = useState<{
    limit: number;
    requested: number;
  } | null>(null);

  // Derived: the active values slot for the current networkType
  const values = networkType === "generated" ? generatedValues : customValues;

  const updateValues = (patch: Partial<GeneratedSimFormValues> | Partial<CustomSimFormValues>) => {
    if (networkType === "generated") {
      storeUpdateGeneratedValues(patch as Partial<GeneratedSimFormValues>);
    } else {
      storeUpdateCustomValues(patch as Partial<CustomSimFormValues>);
    }
  };

  const setNetworkType = (type: "generated" | "custom") => {
    storeSetNetworkType(type);
    setErrors({});
    setUsageLimitError(null);
  };

  const goToStep = (target: WizardStep) => setStep(target);

  const validateAndAdvance = (): boolean => {
    if (networkType === "generated") {
      const errs = validateGeneratedForm(
        generatedValues,
        maxAgents ?? undefined,
        maxIterations ?? undefined,
      );
      setErrors(errs);
      return !hasErrors(errs);
    }
    // custom: step "network" only checks the 4 header fields
    if (step === "network") {
      const errs: SimConfigValidationErrors = {};
      if (!customValues.networkName.trim()) errs.customNetworkNameEmpty = true;
      if (customValues.stopThreshold <= 0 || customValues.stopThreshold >= 1)
        errs.stopThresholdOutOfRange = true;
      if (maxIterations != null && customValues.iterationLimit > maxIterations)
        errs.iterationLimitExceeded = true;
      setErrors(errs);
      return !hasErrors(errs);
    }
    // custom: step "agents" — full validation
    const errs = validateCustomForm(customValues);
    setErrors(errs);
    return !hasErrors(errs);
  };

  const submit = async () => {
    if (networkType === "generated") {
      const errs = validateGeneratedForm(
        generatedValues,
        maxAgents ?? undefined,
        maxIterations ?? undefined,
      );
      setErrors(errs);
      if (hasErrors(errs)) return;
    } else {
      const errs = validateCustomForm(customValues);
      setErrors(errs);
      if (hasErrors(errs)) return;
    }

    setUsageLimitError(null);
    setLoading(true);
    try {
      let result: Awaited<ReturnType<typeof simulationsApi.startGenerated>>;

      if (networkType === "generated") {
        const body = {
          numberOfNetworks: generatedValues.numberOfNetworks,
          density: generatedValues.density,
          iterationLimit: generatedValues.iterationLimit,
          stopThreshold: generatedValues.stopThreshold,
          seed: generatedValues.seed ?? undefined,
          saveMode: generatedValues.saveMode,
          agentTypes: generatedValues.agentTypes.map((row) => ({
            silenceStrategy: row.silenceStrategy as 0 | 1 | 2,
            silenceEffect: row.silenceEffect as 0 | 1,
            count: row.count,
          })),
          biasTypes: generatedValues.biasTypes.map((row) => ({
            biasType: row.cognitiveBias as 0 | 1 | 2 | 3,
            count: row.count,
          })),
        };
        result = await simulationsApi.startGenerated(body);
      } else {
        const shouldUseBinary =
          estimateJsonSize(customValues.agents, customValues.edges) > BINARY_THRESHOLD_BYTES;

        if (shouldUseBinary) {
          const buffer = encodeCustomSimulation({
            networkName: customValues.networkName,
            iterationLimit: customValues.iterationLimit,
            stopThreshold: customValues.stopThreshold,
            saveMode: customValues.saveMode,
            agents: customValues.agents.map((a) => ({
              name: a.name,
              belief: a.belief,
              toleranceRadius: a.toleranceRadius,
              toleranceOffset: a.toleranceOffset,
              silenceStrategy: a.silenceStrategy as 0 | 1 | 2 | 3,
              silenceEffect: a.silenceEffect as 0 | 1 | 2,
            })),
            edges: customValues.edges.map((e) => ({
              source: e.source,
              target: e.target,
              influence: e.influence,
              bias: e.bias as 0 | 1 | 2 | 3 | 4,
            })),
          });
          result = await simulationsApi.startCustomBinary(buffer);
        } else {
          result = await simulationsApi.startCustom({
            name: customValues.networkName,
            iterationLimit: customValues.iterationLimit,
            stopThreshold: customValues.stopThreshold,
            saveMode: customValues.saveMode,
            agents: customValues.agents,
            edges: customValues.edges,
          });
        }
      }

      setRunId(result.runId);
      setStatus("running");
      navigate(`/board/simulation/${result.runId}`);
      storeReset();
    } catch (error) {
      logger.error("useSimulationConfig", error);
      if (isErrorCode(error, "usage_limit_exceeded")) {
        const axiosError = error as {
          response?: { data?: { limit?: number; requested?: number } };
        };
        const limit = axiosError.response?.data?.limit ?? 0;
        const requested = axiosError.response?.data?.requested ?? 0;
        setUsageLimitError({ limit, requested });
        toast.error(t("simulationConfig.errorLimitExceeded"));
      } else {
        toast.error(t("simulationConfig.errorSubmit"));
      }
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (key: string, template: GeneratedSimFormValues) => {
    storeUpdateGeneratedValues(template);
    storeSetActiveTemplate(key);
    setErrors({});
    setUsageLimitError(null);
  };

  return {
    step,
    networkType,
    values,
    errors,
    loading,
    usageLimitError,
    activeTemplate,
    maxAgents: maxAgents ?? null,
    maxIterations: maxIterations ?? null,
    userRole: user?.roles?.[0] ?? null,
    updateValues,
    setNetworkType,
    goToStep,
    validateAndAdvance,
    submit,
    applyTemplate,
  };
}
