import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createHealthRouter } from './routes/health';
import { appConfig } from './config/env';
import { ServiceContext } from './types/service';

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const context: ServiceContext = {
  port: appConfig.port,
  basePath: appConfig.basePath,
};

app.use(`${context.basePath}/health`, createHealthRouter());

app.get('/', (_req, res) => {
  res.json({
    message: 'Spike Recorder Web Service backend ready',
    repository: 'https://github.com/BackyardBrains/Spike-Recorder',
  });
});

app.listen(context.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${context.port}${context.basePath}`);
});
