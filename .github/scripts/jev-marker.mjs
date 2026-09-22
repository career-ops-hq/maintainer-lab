// Señal de Jev persistida en la PR como bloque oculto dentro del comentario de primera respuesta:
//   <!-- co:jev:<pr>:<sha7> {"v":"…","model":"…","domains":{…},"labelsApplied":[…],"ts":"…"} -->
// Un bloque por sha7 (se reemplaza, nunca se duplica); números a 2 decimales; comentario ≤ 60 KB.
// Lo usan la Action (github-src/scripts/triage.mjs, inlineado en el bundle) y la sesión (import directo).

export const JEV_MARKER_RE = /<!--\s*co:jev:(\d+):([0-9a-f]{7})\s+(\{[\s\S]*?\})\s*-->/g;
export const MAX_COMMENT_BYTES_JEV = 60 * 1024;

/** Redondea todo número a 2 decimales, recursivamente. */
export function round2(v) {
  if (typeof v === 'number') return Number.isInteger(v) ? v : Math.round(v * 100) / 100;
  if (Array.isArray(v)) return v.map(round2);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, round2(x)]));
  return v;
}
export function buildJevMarker(pr, sha7, payload) {
  const json = JSON.stringify(round2(payload)).replace(/-->/g, '--\\u003e'); // "-->" dentro del JSON cerraría el comentario; \u003e es un escape JSON válido
  return `<!-- co:jev:${pr}:${sha7} ${json} -->`;
}
/** Todos los bloques del cuerpo, en orden: [{pr, sha7, ...payload}]. Un JSON corrupto se salta. */
export function parseJevMarkers(body) {
  const out = [];
  for (const m of String(body || '').matchAll(JEV_MARKER_RE)) {
    try { out.push({ pr: Number(m[1]), sha7: m[2], ...JSON.parse(m[3]) }); } catch { /* corrupto: se ignora */ }
  }
  return out;
}
/** El último bloque (señal más reciente) o null. Con `sha7`, el de ese sha o null. */
export function parseJevMarker(body, sha7 = null) {
  const all = parseJevMarkers(body);
  return sha7 ? all.find((b) => b.sha7 === sha7) || null : all.at(-1) || null;
}
/** Inserta o reemplaza el bloque de ese sha7 al final del cuerpo. Si no cabe en 60 KB, quita los bloques más antiguos. */
export function upsertJevMarker(body, pr, sha7, payload) {
  const block = buildJevMarker(pr, sha7, payload);
  const own = new RegExp(`\\n*<!--\\s*co:jev:${pr}:${sha7}\\s+\\{[\\s\\S]*?\\}\\s*-->`, 'g');
  let out = String(body || '').replace(own, '').replace(/\s+$/, '') + `\n\n${block}`;
  for (;;) {
    if (Buffer.byteLength(out) <= MAX_COMMENT_BYTES_JEV) return out;
    const oldest = [...out.matchAll(JEV_MARKER_RE)].find((m) => m[2] !== sha7);
    if (!oldest) throw new Error(`bloque jev de #${pr} supera 60 KB (${MAX_COMMENT_BYTES_JEV} bytes) por sí solo`);
    out = out.replace(oldest[0], '').replace(/\n{3,}/g, '\n\n');
  }
}
