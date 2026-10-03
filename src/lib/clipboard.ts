export interface ClipboardDeps {
  writeText?: (text: string) => Promise<void>;
  legacy: (text: string) => boolean;
}

function legacyCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

function defaultDeps(): ClipboardDeps {
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;
  return {
    writeText: nav?.clipboard?.writeText ? (t) => nav.clipboard.writeText(t) : undefined,
    legacy: legacyCopy,
  };
}

/** Copies text; resolves true on success, false if every method failed. Never throws. */
export async function copyText(text: string, deps: ClipboardDeps = defaultDeps()): Promise<boolean> {
  if (deps.writeText) {
    try {
      await deps.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy method */
    }
  }
  try {
    return deps.legacy(text);
  } catch {
    return false;
  }
}
