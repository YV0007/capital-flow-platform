// Storage helpers — thin JSON wrappers around the window.storage shim that
// the monolith installed at the top of index_slim.html. The shim itself is
// reinstalled here from index.html (early-loaded inline script) so callers
// can rely on window.storage existing before React mounts.

export async function loadKey(key, fallback) {
  try {
    const r = await window.storage.get(key);
    return r ? JSON.parse(r.value) : fallback;
  } catch {
    return fallback;
  }
}

export async function saveKey(key, value) {
  try {
    await window.storage.set(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('Storage write failed:', key, e);
    return false;
  }
}
