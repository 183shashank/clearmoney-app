const STORAGE_KEY = 'cm_cat_overrides';

// Strip reference numbers so "UPI 12345 VENDOR" and "UPI 99999 VENDOR" share the same key
export function normalizeDesc(description) {
  return (description || '')
    .toLowerCase()
    .replace(/\d+/g, '')         // remove all digits
    .replace(/[^a-z\s]/g, ' ')  // non-alpha → space
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 50);
}

export function loadOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveOverride(description, category) {
  const overrides = loadOverrides();
  const key = normalizeDesc(description);
  if (!key) return overrides;
  overrides[key] = category;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  return overrides;
}

export function removeOverride(description) {
  const overrides = loadOverrides();
  delete overrides[normalizeDesc(description)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  return overrides;
}

export function getEffectiveCategory(description, autoCategory, overrides) {
  const key = normalizeDesc(description);
  return (key && overrides[key]) ? overrides[key] : autoCategory;
}
