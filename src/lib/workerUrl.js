// Cloudflare worker URL — feeds the news/brief/weekly panels. User can override
// per session via Settings; default is the production worker.

import { useEffect, useState } from 'react';

export const NEWS_WORKER_URL_DEFAULT = 'https://news-monitor.egorvasylchenko02.workers.dev';
export const NEWS_WORKER_URL_KEY = 'app:news-worker-url';
export const NEWS_CACHE_TTL_MS = 60 * 60 * 1000;
export const NEWS_WORKER_CACHE_TTL_MS = 30 * 60 * 1000;

export function useWorkerUrl() {
  const [url, setUrl] = useState(NEWS_WORKER_URL_DEFAULT);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const u = await window.storage.get(NEWS_WORKER_URL_KEY);
        if (!cancelled && u && u.value) setUrl(u.value);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);
  return url;
}
