import type { Book } from "./types";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Tiny markdown subset: paragraphs, "- " lists, **bold**, *italic*. */
export function mdToHtml(md: string) {
  const inline = (s: string) => esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
  return md
    .trim()
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.split("\n");
      if (lines.every((l) => l.startsWith("- "))) return `<ul>${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      if (lines[0] && !lines[0].startsWith("- ") && lines.slice(1).every((l) => l.startsWith("- ")) && lines.length > 1)
        return `<p>${inline(lines[0])}</p><ul>${lines.slice(1).map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      return `<p>${inline(lines.join(" "))}</p>`;
    })
    .join("");
}

export function toMarkdown(b: Book) {
  const parts = [`# ${b.title ?? b.topic}`, b.subtitle ? `### ${b.subtitle}` : "", b.authorName ? `*by ${b.authorName}*` : ""];
  (b.outline ?? []).forEach((c, i) => {
    parts.push(`\n# Chapter ${i + 1}: ${c.title}`);
    c.sections.forEach((s) => s.content.trim() && parts.push(`## ${s.title}\n\n${s.content.trim()}`));
  });
  if (b.bio) parts.push(`\n# About the Author\n\n${b.bio}`);
  return parts.filter(Boolean).join("\n\n") + "\n";
}

/**
 * Full-bleed cover page. AI art is embedded as-is (with the text overlaid unless the art is lettered);
 * CSS covers export as the "Classic" layout in the chosen colours, since the other layouts rely on Tailwind.
 */
function coverHtml(b: Book) {
  const c = b.cover;
  if (!c) return "";
  const font = c.font === "serif" ? "Georgia, serif" : "Helvetica, Arial, sans-serif";
  const text = `<div class="cover-text" style="color:${c.fg};font-family:${font}">
<div><div class="cover-title">${esc(b.title ?? b.topic)}</div><div class="cover-rule" style="background:${c.accent}"></div>${b.subtitle ? `<div class="cover-sub">${esc(b.subtitle)}</div>` : ""}</div>
<div class="cover-author">${esc(b.authorName ?? "")}</div></div>`;
  if (c.image) {
    return `<section class="cover"><img src="${c.image}" alt="">${c.imageText ? "" : `<div class="cover-scrim"></div>${text}`}</section>`;
  }
  return `<section class="cover" style="background:${c.bg}">${text}</section>`;
}

export function toHtml(b: Book) {
  const paras = (t: string) => t.trim().split(/\n{2,}/).map((p) => `<p>${esc(p)}</p>`).join("\n");
  const chapters = (b.outline ?? [])
    .map(
      (c, i) => `<section class="chapter"><div class="num">Chapter ${i + 1}</div><h1>${esc(c.title)}</h1>
${c.sections.filter((s) => s.content.trim()).map((s) => `<h2>${esc(s.title)}</h2>\n${paras(s.content)}`).join("\n")}</section>`,
    )
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(b.title ?? b.topic)}</title>
<style>
@page { size: 6in 9in; margin: 0.75in 0.6in; }
body { font-family: Georgia, serif; font-size: 11.5pt; line-height: 1.6; max-width: 34em; margin: auto; color: #111; }
.title { text-align: center; page-break-after: always; padding-top: 30%; }
.title h1 { font-size: 30pt; margin: 0 } .title h3 { font-weight: normal; font-style: italic }
.toc { page-break-after: always } .toc li { margin: .3em 0 }
.chapter { page-break-before: always; } .num { text-transform: uppercase; letter-spacing: .2em; font-size: 9pt; color: #888; margin-top: 2in }
h1 { font-size: 22pt } h2 { font-size: 13pt; margin-top: 1.6em } p { text-indent: 1.5em; margin: 0 0 .4em; text-align: justify }
h2 + p, h1 + p { text-indent: 0 }
@page cover { margin: 0 }
.cover { page: cover; position: relative; width: 6in; height: 9in; margin: 0 auto 2em; overflow: hidden; page-break-after: always; print-color-adjust: exact; -webkit-print-color-adjust: exact }
.cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover }
.cover-scrim { position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,.55), transparent 50%, transparent 75%, rgba(0,0,0,.55)) }
.cover-text { position: relative; height: 100%; box-sizing: border-box; padding: .6in; display: flex; flex-direction: column; justify-content: space-between; text-align: center }
.cover-title { font-size: 34pt; font-weight: bold; line-height: 1.05; margin-top: .4in } .cover-sub { font-size: 13pt; line-height: 1.35; opacity: .9 }
.cover-rule { width: 25%; height: 2px; margin: .3in auto } .cover-author { font-size: 13pt; letter-spacing: .2em; text-transform: uppercase }
@media print { .cover { margin: 0 } }
</style></head><body>
${coverHtml(b)}
<div class="title"><h1>${esc(b.title ?? b.topic)}</h1>${b.subtitle ? `<h3>${esc(b.subtitle)}</h3>` : ""}<p style="text-indent:0;margin-top:3em">${esc(b.authorName ?? "")}</p></div>
<div class="toc"><h1>Contents</h1><ol>${(b.outline ?? []).map((c) => `<li>${esc(c.title)}</li>`).join("")}</ol></div>
${chapters}
${b.bio ? `<section class="chapter"><h1>About the Author</h1>${paras(b.bio)}</section>` : ""}
</body></html>`;
}

export function download(filename: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "book";
