export function computeAge(
  birthDate: Date | string | null | undefined
): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  if (age < 0 || age > 130) return null;
  return age;
}

export function displayAge(
  birthDate: Date | string | null | undefined,
  storedAge?: number | null
): number | null {
  const live = computeAge(birthDate);
  return live ?? storedAge ?? null;
}
