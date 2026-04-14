export interface AppConfig {
  host: string;
  port: number;
  corsOrigin: string;
}

function parsePort(value: string | undefined): number {
  if (!value) {
    return 8080;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}

export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const host = env.HOST || '0.0.0.0';
  const port = parsePort(env.PORT);
  const corsOrigin = env.CORS_ORIGIN || 'http://localhost:3000';

  if (!corsOrigin.trim()) {
    throw new Error('CORS_ORIGIN must not be empty');
  }

  return { host, port, corsOrigin };
}
