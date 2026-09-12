export const FONT_SIZES = [0.85, 1, 1.15, 1.3] as const;

export const DEFAULT_FONT_SCALE_INDEX = 1;

const STORAGE_KEY = "novel-reader-preferences";

type ReaderPreferences = {
  fontScaleIndex: number;
};

const isBrowser = () => typeof window !== "undefined";

let cachedRaw: string | null | undefined;
let cachedIndex = DEFAULT_FONT_SCALE_INDEX;

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

function parseIndex(raw: string | null): number {
  if (raw === null) {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  try {
    const parsed = JSON.parse(raw) as ReaderPreferences;
    if (
      Number.isInteger(parsed.fontScaleIndex) &&
      parsed.fontScaleIndex >= 0 &&
      parsed.fontScaleIndex < FONT_SIZES.length
    ) {
      return parsed.fontScaleIndex;
    }
  } catch {
    // Invalid JSON falls through to the default.
  }

  return DEFAULT_FONT_SCALE_INDEX;
}

export function getReaderFontScaleIndex(): number {
  if (!isBrowser()) return DEFAULT_FONT_SCALE_INDEX;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedIndex;
    cachedRaw = raw;
    cachedIndex = parseIndex(raw);
    return cachedIndex;
  } catch {
    return DEFAULT_FONT_SCALE_INDEX;
  }
}

export function setReaderFontScaleIndex(index: number): void {
  if (!isBrowser()) return;
  if (
    !Number.isInteger(index) ||
    index < 0 ||
    index >= FONT_SIZES.length
  ) {
    return;
  }

  const preferences: ReaderPreferences = { fontScaleIndex: index };

  try {
    const raw = JSON.stringify(preferences);
    localStorage.setItem(STORAGE_KEY, raw);
    cachedRaw = raw;
    cachedIndex = index;
    notifyListeners();
  } catch {
    // localStorage may be full or unavailable.
  }
}

export function subscribeToFontPreferences(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

if (isBrowser()) {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      cachedRaw = undefined;
      cachedIndex = DEFAULT_FONT_SCALE_INDEX;
      notifyListeners();
    }
  });
}
