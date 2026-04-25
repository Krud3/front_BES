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
import { CONSENSUS_PURSUIT_TEMPLATE } from "../lib/templates";
import { generatedSimSchema } from "../lib/validation";
import type {
  CustomSimFormValues,
  GeneratedSimFormValues,
  SimConfigValidationErrors,
  SimFormValues,
  WizardStep,
} from "../types/simulation-config.types";

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

const DEFAULT_FORM: GeneratedSimFormValues = { ...CONSENSUS_PURSUIT_TEMPLATE };

export function useSimulationConfig() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const setRunId = useSimulationStore((s) => s.setRunId);
  const setStatus = useSimulationStore((s) => s.setStatus);
  const user = useAuthStore((s) => s.user);

  const maxAgents = user?.usageLimits?.maxAgents;
  const maxIterations = user?.usageLimits?.maxIterations;

  const [step, setStep] = useState<WizardStep>("network");
  const [values, setValues] = useState<SimFormValues>(DEFAULT_FORM);
  const [errors, setErrors] = useState<SimConfigValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [usageLimitError, setUsageLimitError] = useState<{
    limit: number;
    requested: number;
  } | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  const updateValues = (patch: Partial<SimFormValues>) => {
    setValues((prev) => ({ ...prev, ...patch }) as SimFormValues);
  };

  const goToStep = (target: WizardStep) => setStep(target);

  const validateAndAdvance = (): boolean => {
    if (values.networkType === "generated") {
      const errs = validateGeneratedForm(
        values,
        maxAgents ?? undefined,
        maxIterations ?? undefined,
      );
      setErrors(errs);
      return !hasErrors(errs);
    }
    return true;
  };

  const submit = async () => {
    if (values.networkType === "generated") {
      const errs = validateGeneratedForm(
        values,
        maxAgents ?? undefined,
        maxIterations ?? undefined,
      );
      setErrors(errs);
      if (hasErrors(errs)) return;
    }

    setUsageLimitError(null);
    setLoading(true);
    try {
      let result: Awaited<ReturnType<typeof simulationsApi.startGenerated>>;

      if (values.networkType === "generated") {
        const body = {
          numberOfNetworks: values.numberOfNetworks,
          density: values.density,
          iterationLimit: values.iterationLimit,
          stopThreshold: values.stopThreshold,
          seed: values.seed ?? undefined,
          saveMode: values.saveMode,
          agentTypes: values.agentTypes.map((row) => ({
            silenceStrategy: row.silenceStrategy as 0 | 1 | 2,
            silenceEffect: row.silenceEffect as 0 | 1,
            count: row.count,
          })),
          biasTypes: values.biasTypes.map((row) => ({
            biasType: row.cognitiveBias as 0 | 1 | 2 | 3,
            count: row.count,
          })),
        };
        result = await simulationsApi.startGenerated(body);
      } else {
        const customValues = values as CustomSimFormValues;
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
    setValues(template);
    setActiveTemplate(key);
    setErrors({});
    setUsageLimitError(null);
  };

  return {
    step,
    values,
    errors,
    loading,
    usageLimitError,
    activeTemplate,
    maxAgents: maxAgents ?? null,
    maxIterations: maxIterations ?? null,
    userRole: user?.roles?.[0] ?? null,
    updateValues,
    goToStep,
    validateAndAdvance,
    submit,
    applyTemplate,
  };
}
