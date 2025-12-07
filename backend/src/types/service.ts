import { HealthStatus } from '@byb/shared';

export interface ServiceContext {
  port: number;
  basePath: string;
}

export type HealthResponse = HealthStatus;
