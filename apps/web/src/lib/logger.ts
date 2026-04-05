type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  msg: string;
  module?: string;
  requestId?: string;
  tenantId?: string;
  userId?: string;
  [key: string]: unknown;
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

function formatLog(entry: LogEntry): string {
  if (IS_PRODUCTION) {
    // JSON output for production (parseable by log aggregators)
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }
  // Human-readable for development
  const prefix = `[${entry.level.toUpperCase()}]`;
  const mod = entry.module ? ` [${entry.module}]` : "";
  const extra = Object.entries(entry)
    .filter(([k]) => !["level", "msg", "module"].includes(k))
    .map(([k, v]) => `${k}=${JSON.stringify(v)}`)
    .join(" ");
  return `${prefix}${mod} ${entry.msg}${extra ? " " + extra : ""}`;
}

function log(
  level: LogLevel,
  msg: string,
  meta?: Omit<LogEntry, "level" | "msg">,
) {
  const entry: LogEntry = { level, msg, ...meta };
  const output = formatLog(entry);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      if (!IS_PRODUCTION) console.debug(output);
      break;
    default:
      console.info(output);
  }
}

/** Create a module-scoped logger */
export function createLogger(module: string) {
  return {
    debug: (msg: string, meta?: Record<string, unknown>) =>
      log("debug", msg, { module, ...meta }),
    info: (msg: string, meta?: Record<string, unknown>) =>
      log("info", msg, { module, ...meta }),
    warn: (msg: string, meta?: Record<string, unknown>) =>
      log("warn", msg, { module, ...meta }),
    error: (msg: string, meta?: Record<string, unknown>) =>
      log("error", msg, { module, ...meta }),
  };
}
