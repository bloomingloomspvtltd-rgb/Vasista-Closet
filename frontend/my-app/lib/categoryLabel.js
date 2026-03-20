export function normalizeCategoryLabel(label) {
  const raw = (label || "").trim();
  if (!raw) return "";

  const normalized = raw
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const fixes = {
    kurthas: "Kurtas",
    kurtha: "Kurta",
    "kurtha sets": "Kurta Sets",
    kurthasets: "Kurta Sets",
    kurthis: "Kurtis",
  };

  return fixes[normalized] || raw;
}
