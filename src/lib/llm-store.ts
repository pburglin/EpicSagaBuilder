// Store for LLM response timing
let lastResponseTime = 60000; // Default to 60 seconds

export function updateLastResponseTime(startTime: number, endTime: number) {
  lastResponseTime = endTime - startTime;
  console.log('Updated LLM response time:', lastResponseTime);
}

export function getEstimatedProgress(startTime: number): number {
  const elapsed = Date.now() - startTime;
  const progress = (elapsed / lastResponseTime) * 100;
  return Math.min(95, Math.max(0, progress)); // Cap between 0-95%
}