// ─────────────────────────────────────────────
// Shared utilities: markdown helpers and fetch wrappers.
// Pure functions — no DOM, no mutable state imports.
// Used by both the mobile and desktop paths.
// ─────────────────────────────────────────────

export function stripMd(txt) {
  return txt
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function fetchMdBody(id) {
  try {
    const txt = await fetch(`media/projects/${id}/description.md`).then(r => r.ok ? r.text() : null);
    return txt ? stripMd(txt) : null;
  } catch { return null; }
}

export function parseKeywordMd(txt) {
  const seen = new Set();
  const keywords = [];
  // Strip HTML comments before splitting into lines so multi-line comments are
  // removed cleanly, then process each remaining line individually.
  txt.replace(/<!--[\s\S]*?-->/g, '').split('\n').forEach(raw => {
    const clean = raw
      .replace(/^\s*[-*+]\s+/, '')
      .replace(/^\s*\d+\.\s+/, '')
      .replace(/^\s*#+\s+/, '')
      .trim();
    if (!clean) return;
    const key = clean.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    keywords.push(clean);
  });
  return keywords;
}

export async function fetchKeywords() {
  try {
    const txt = await fetch('media/search-keywords.md').then(r => r.ok ? r.text() : '');
    return txt ? parseKeywordMd(txt) : [];
  } catch {
    return [];
  }
}

// Parse YAML-ish frontmatter from detail.md into a plain object.
// Supports string scalars, indented list items, and nested list-of-objects.
export function parseFrontmatter(txt) {
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const LIST_KEYS = new Set(['images', 'tools', 'links', 'texts']);
  const out = {};
  const lines = m[1].split('\n');
  let key = null, listKey = null, listObj = null;
  for (const raw of lines) {
    const line = raw.trimEnd();
    // nested object item inside a list:  "  - label: ..."
    const objItem = line.match(/^  - (\w+):\s*"?([^"]*)"?$/);
    if (objItem && listKey) {
      listObj = { [objItem[1]]: objItem[2].trim() };
      if (!Array.isArray(out[listKey])) out[listKey] = [];
      out[listKey].push(listObj);
      continue;
    }
    // continuation key on a list object:  "    url: ..."
    const objCont = line.match(/^    (\w+):\s*"?([^"]*)"?$/);
    if (objCont && listObj) {
      listObj[objCont[1]] = objCont[2].trim();
      continue;
    }
    // plain list item:  "  - value"
    const listItem = line.match(/^  - (.+)$/);
    if (listItem && listKey) {
      if (!Array.isArray(out[listKey])) out[listKey] = [];
      out[listKey].push(listItem[1].replace(/^"|"$/g, '').trim());
      listObj = null;
      continue;
    }
    // top-level list key with no inline value
    const listStart = line.match(/^(\w+):\s*(?:\[\s*\])?\s*$/);
    if (listStart && LIST_KEYS.has(listStart[1])) {
      listKey = listStart[1];
      out[listKey] = [];
      key = null; listObj = null;
      continue;
    }
    // top-level key: value
    const kv = line.match(/^(\w+):\s*"?([^"]*)"?$/);
    if (kv) {
      key = kv[1]; listKey = null; listObj = null;
      const val = kv[2].trim();
      out[key] = val === '' ? null : val;
      continue;
    }
  }
  return out;
}

export async function fetchDetail(id) {
  try {
    const txt = await fetch(`media/projects/${id}/detail.md`).then(r => r.ok ? r.text() : null);
    return txt ? parseFrontmatter(txt) : {};
  } catch { return {}; }
}
