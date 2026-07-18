// Shared by every simulated endpoint: 300–700 ms latency, then a 5% failure rate.
// Math.random (not the dataset's seeded PRNG) is intentional — the DATA must be
// deterministic, but latency and failures should differ on every call so the
// client's loading/error/retry paths get exercised for real.

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 700;
const FAILURE_RATE = 0.05;

export async function withSimulation<T>(data: () => T): Promise<T> {
  const delay = MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (Math.random() < FAILURE_RATE) {
    throw new Error("Simulated upstream failure. Retry the request.");
  }

  return data();
}
