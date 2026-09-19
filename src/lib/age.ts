// Live age from a birth date, recomputed every time it's read (so it advances
// on the resident's birthday without needing the stored `age` to be updated).
// Falls back to null when there is no usable birth date.
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

// Live age when possible, otherwise the stored value (for records with no birth date).
export function displayAge(
  birthDate: Date | string | null | undefined,
  storedAge?: number | null
): number | null {
  const live = computeAge(birthDate);
  return live ?? storedAge ?? null;
}
