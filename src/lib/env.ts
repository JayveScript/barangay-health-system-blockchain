/**
 * Read env vars with bracket notation so Next.js does not inline
 * undefined values at build time when secrets are added later on Vercel.
 */
export function env(name: string): string | undefined {
  return process.env[name];
}

export function hasEnv(name: string): boolean {
  const value = env(name);
  return typeof value === "string" && value.length > 0;
}
