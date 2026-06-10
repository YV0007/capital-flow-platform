import React, { useState } from 'react';

export default function CompanyLogo({ brand, size = 56 }) {
  const [errored, setErrored] = useState(false);
  // Derive domain from the brand name. "Zeely.ai" → "zeely.ai".
  const domain = (brand || '').trim().toLowerCase().replace(/\s+/g, '');
  // Google's S2 favicon service works for any domain, CORS-friendly,
  // and returns a sharp PNG. sz=128 keeps it crisp at display sizes up to ~64px.
  const url = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : '';
  const initial = (brand || '?').trim().charAt(0).toUpperCase();

  if (errored || !url) {
    return (
      <div
        className="rounded-lg shrink-0 flex items-center justify-center bg-cyan-700 text-zinc-100 font-bold border border-cyan-600"
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        title={brand}
      >
        {initial}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={`${brand} logo`}
      title={brand}
      onError={() => setErrored(true)}
      className="rounded-lg shrink-0 bg-zinc-950 border border-zinc-800 object-contain p-1"
      style={{ width: size, height: size }}
    />
  );
}
