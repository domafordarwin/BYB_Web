import { HealthStatus } from '@byb/shared';
import { apiFetch } from './client';

export const fetchHealthStatus = async (): Promise<HealthStatus> => {
  return apiFetch<HealthStatus>('/health');
};
