import { useEffect, useState } from 'react';
import { HealthStatus, RecordingSession } from '@byb/shared';
import { fetchHealthStatus } from './api/health';

const sampleSession: RecordingSession = {
  id: 'demo-001',
  name: 'Demo Spike Recording',
  samplingRateHz: 10000,
  channelCount: 4,
  sourceRepoUrl: 'https://github.com/BackyardBrains/Spike-Recorder',
};

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthStatus()
      .then(setHealth)
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        // eslint-disable-next-line no-console
        console.error('Health check failed', err);
      });
  }, []);

  return (
    <main style={{ fontFamily: 'Inter, system-ui, sans-serif', padding: '1.5rem', lineHeight: 1.6 }}>
      <h1>Spike Recorder Web Service</h1>
      <p>
        This scaffold prepares a web-based migration for the desktop Spike Recorder project.
        It links to the original repository and provides a simple health-check endpoint plus shared types.
      </p>
      <section style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Repository Reference</h2>
        <p>
          Upstream code: <a href="https://github.com/BackyardBrains/Spike-Recorder" target="_blank" rel="noreferrer">BackyardBrains/Spike-Recorder</a>
        </p>
        <h3>Example Session Metadata</h3>
        <ul>
          <li><strong>ID:</strong> {sampleSession.id}</li>
          <li><strong>Name:</strong> {sampleSession.name}</li>
          <li><strong>Sampling Rate:</strong> {sampleSession.samplingRateHz} Hz</li>
          <li><strong>Channels:</strong> {sampleSession.channelCount}</li>
          <li>
            <strong>Source:</strong> <a href={sampleSession.sourceRepoUrl} target="_blank" rel="noreferrer">Spike Recorder GitHub</a>
          </li>
        </ul>
      </section>
      <section style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Backend Health</h2>
        {health && (
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{health.status}</dd>
            </div>
            <div>
              <dt>Service</dt>
              <dd>{health.service}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{health.timestamp}</dd>
            </div>
            {health.notes && (
              <div>
                <dt>Notes</dt>
                <dd>{health.notes}</dd>
              </div>
            )}
          </dl>
        )}
        {!health && !error && <p>Loading health status…</p>}
        {error && <p style={{ color: 'red' }}>Failed to reach backend: {error}</p>}
      </section>
    </main>
  );
}

export default App;
