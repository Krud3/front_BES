import "./auth-interceptor";
import { backendClient } from "./client";
import type {
  CustomRunRequest,
  GeneratedRunRequest,
  NetworkListResponse,
  PaginationParams,
  ResultsParams,
  ResultsResponse,
  RunCancelledResponse,
  RunSummary,
  SimCreated,
  SimulationListResponse,
  TopologyParams,
  TopologyResponse,
  WsTicketResponse,
} from "./types/backend.types";

export const simulationsApi = {
  async startGenerated(body: GeneratedRunRequest): Promise<SimCreated> {
    const { data } = await backendClient.post<SimCreated>(
      "/simulations/generated",
      body,
    );
    return data;
  },

  async startCustom(body: CustomRunRequest): Promise<SimCreated> {
    const { data } = await backendClient.post<SimCreated>(
      "/simulations/custom",
      body,
    );
    return data;
  },

  async startCustomBinary(payload: ArrayBuffer): Promise<SimCreated> {
    const { data } = await backendClient.post<SimCreated>(
      "/simulations/custom",
      payload,
      { headers: { "Content-Type": "application/octet-stream" } },
    );
    return data;
  },

  async listMine(params?: PaginationParams): Promise<SimulationListResponse> {
    const { data } = await backendClient.get<SimulationListResponse>(
      "/simulations/mine",
      { params },
    );
    return data;
  },

  async listAll(params?: PaginationParams): Promise<SimulationListResponse> {
    const { data } = await backendClient.get<SimulationListResponse>(
      "/simulations",
      { params },
    );
    return data;
  },

  async getById(runId: string): Promise<RunSummary> {
    const { data } = await backendClient.get<RunSummary>(
      `/simulations/${runId}`,
    );
    return data;
  },

  async cancel(runId: string): Promise<RunCancelledResponse> {
    const { data } = await backendClient.delete<RunCancelledResponse>(
      `/simulations/${runId}`,
    );
    return data;
  },

  async listNetworks(runId: string): Promise<NetworkListResponse> {
    const { data } = await backendClient.get<NetworkListResponse>(
      `/simulations/${runId}/networks`,
    );
    return data;
  },

  async getTopology(
    runId: string,
    networkId: string,
    params?: TopologyParams,
  ): Promise<TopologyResponse | null> {
    const response = await backendClient.get<TopologyResponse>(
      `/simulations/${runId}/networks/${networkId}/topology`,
      { params, validateStatus: (s) => s === 200 || s === 202 },
    );
    if (response.status === 202) return null;
    return response.data;
  },

  async getResults(
    runId: string,
    networkId: string,
    params?: ResultsParams,
  ): Promise<ResultsResponse | null> {
    const response = await backendClient.get<ResultsResponse>(
      `/simulations/${runId}/networks/${networkId}/results`,
      { params, validateStatus: (s) => s === 200 || s === 202 },
    );
    if (response.status === 202) return null;
    return response.data;
  },

  async getWsTicket(runId: string): Promise<WsTicketResponse> {
    const { data } = await backendClient.post<WsTicketResponse>(
      `/simulations/${runId}/ws-ticket`,
    );
    return data;
  },
};
