export interface RecordingSession {
  id: string;
  name: string;
  samplingRateHz: number;
  channelCount: number;
  sourceRepoUrl: string;
}

export interface HealthStatus {
  status: 'ok';
  service: 'spike-recorder-web';
  timestamp: string;
  notes?: string;
}
