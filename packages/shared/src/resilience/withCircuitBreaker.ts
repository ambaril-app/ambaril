import { CircuitOpenError } from "./errors";

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetMs?: number;
  halfOpenMax?: number;
}

type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitSnapshot {
  state: CircuitState;
  failures: number;
  openedAt: number;
  halfOpenInFlight: number;
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_RESET_MS = 60_000;
const DEFAULT_HALF_OPEN_MAX = 1;

/**
 * Wrap an async operation with a circuit breaker.
 *
 * @example
 * const guardedCall = withCircuitBreaker(
 *   () => fetch("https://api.example.com/provider").then((res) => res.json()),
 *   { failureThreshold: 3, resetMs: 10_000 },
 * );
 * const result = await guardedCall();
 */
export function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  options: CircuitBreakerOptions = {},
): () => Promise<T> {
  const snapshot: CircuitSnapshot = {
    state: "CLOSED",
    failures: 0,
    openedAt: 0,
    halfOpenInFlight: 0,
  };
  const threshold = options.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD;
  const resetMs = options.resetMs ?? DEFAULT_RESET_MS;
  const halfOpenMax = options.halfOpenMax ?? DEFAULT_HALF_OPEN_MAX;

  return async () => runCircuit(fn, snapshot, threshold, resetMs, halfOpenMax);
}

async function runCircuit<T>(
  fn: () => Promise<T>,
  snapshot: CircuitSnapshot,
  threshold: number,
  resetMs: number,
  halfOpenMax: number,
): Promise<T> {
  const wasHalfOpen = prepareAttempt(snapshot, resetMs, halfOpenMax);

  try {
    const result = await fn();
    resetSnapshot(snapshot);
    return result;
  } catch (error) {
    registerFailure(snapshot, threshold);
    throw error;
  } finally {
    finalizeHalfOpen(snapshot, wasHalfOpen);
  }
}

function prepareAttempt(
  snapshot: CircuitSnapshot,
  resetMs: number,
  halfOpenMax: number,
): boolean {
  advanceState(snapshot, resetMs);
  guardHalfOpen(snapshot, halfOpenMax);
  const isHalfOpen = snapshot.state === "HALF_OPEN";
  if (isHalfOpen) snapshot.halfOpenInFlight += 1;
  return isHalfOpen;
}

function advanceState(snapshot: CircuitSnapshot, resetMs: number): void {
  if (snapshot.state !== "OPEN") return;
  if (Date.now() - snapshot.openedAt < resetMs) throw new CircuitOpenError();
  snapshot.state = "HALF_OPEN";
  snapshot.halfOpenInFlight = 0;
}

function guardHalfOpen(snapshot: CircuitSnapshot, halfOpenMax: number): void {
  if (snapshot.state !== "HALF_OPEN") return;
  if (snapshot.halfOpenInFlight >= halfOpenMax) {
    throw new CircuitOpenError("Circuit breaker is half-open and busy");
  }
}

function registerFailure(snapshot: CircuitSnapshot, threshold: number): void {
  snapshot.failures += 1;
  if (snapshot.failures < threshold) return;
  snapshot.state = "OPEN";
  snapshot.openedAt = Date.now();
}

function finalizeHalfOpen(
  snapshot: CircuitSnapshot,
  wasHalfOpen: boolean,
): void {
  if (!wasHalfOpen || snapshot.halfOpenInFlight === 0) return;
  snapshot.halfOpenInFlight -= 1;
}

function resetSnapshot(snapshot: CircuitSnapshot): void {
  snapshot.state = "CLOSED";
  snapshot.failures = 0;
  snapshot.halfOpenInFlight = 0;
}
