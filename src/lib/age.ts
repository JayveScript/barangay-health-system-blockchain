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

export function computeMonths(
  birthDate: Date | string | null | undefined
): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  if (b.getTime() > now.getTime()) return null;
  let months =
    (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) months -= 1;
  return months < 0 ? 0 : months;
}

// Human-readable age. Babies under 1 year are shown in months (or days for
// newborns) instead of "0" so infants aren't misrepresented as age 0.
export function ageLabel(
  birthDate: Date | string | null | undefined,
  storedAge?: number | null
): string {
  if (birthDate) {
    const b = new Date(birthDate);
    if (!Number.isNaN(b.getTime()) && b.getTime() <= Date.now()) {
      const years = computeAge(b);
      if (years != null && years >= 1) {
        return `${years} year${years === 1 ? "" : "s"}`;
      }
      const months = computeMonths(b) ?? 0;
      if (months >= 1) return `${months} month${months === 1 ? "" : "s"}`;
      const days = Math.floor((Date.now() - b.getTime()) / 86400000);
      if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
      return "Newborn";
    }
  }
  if (storedAge != null && Number.isFinite(storedAge)) {
    return `${storedAge} year${storedAge === 1 ? "" : "s"}`;
  }
  return "";
}
