export function env(name: string): string | undefined {
  return process.env[name];
}

export function hasEnv(name: string): boolean {
  const value = env(name);
  return typeof value === "string" && value.length > 0;
}
