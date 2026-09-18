import path from "node:path";

import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
});

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

function parsePort(value: string | undefined): number {
  const port = Number(value ?? 3000);

  if (!Number.isInteger(port) || port <= 0 || port >= 65535) {
    throw new Error("Port must be a valid TCP port");
  }
  return port;
}

function parseApiId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("API_ID must be a positive integer");
  }
  return id;
}

const config = (() => {
  return {
    nodeEnv: process.env.NODE_ENV || "production",
    port: parsePort(process.env.APP_PORT),
    apiId: parseApiId(requireEnv("API_ID")),
    apiHash: requireEnv("API_HASH"),
    apiToken: requireEnv("API_TOKEN"),
    sessionFile: path.resolve(process.cwd(), process.env.SESSION_FILE || "session.txt"),
  };
})();

export default config;
