type LogLevel = "INFO" | "WARN" | "ERROR";

function serializeMeta(meta?: unknown): string {
  if (meta === undefined) {
    return "";
  }

  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [unserializable metadata]";
  }
}

function write(level: LogLevel, message: string, meta?: unknown): void {
  const line = `[${new Date().toISOString()}] ${level} ${message}${serializeMeta(meta)}`;

  if (level === "ERROR") {
    console.error(line);
    return;
  }

  if (level === "WARN") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  info: (message: string, meta?: unknown) => write("INFO", message, meta),
  warn: (message: string, meta?: unknown) => write("WARN", message, meta),
  error: (message: string, meta?: unknown) => write("ERROR", message, meta),
};
