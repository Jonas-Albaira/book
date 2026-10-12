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
</style></head><body>
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
