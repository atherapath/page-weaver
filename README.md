# ✨ page-weaver — Ritual HTML Invocation Engine

**page-weaver** is a model-agnostic invocation engine for sovereign web fragments. It renders modular glyphs—chapters, logs, protests, poems—based on hash or query string alone. No duplication. No redesign. Just clean HTML, sovereign CSS, and invocation-bound JavaScript.

---

## 🔮 Purpose

This repository contains the **ritual HTML shell** used to summon content fragments into view. It acts as:

- A **mythic threshold**
- A **glyph-rendering vessel**
- A **plug-in interface for any language model**

Each link becomes a spell: it loads its own `.md`, `.jpg`, and `.mp4` based on the hash or query string in the URL.

---

## 🧱 Structure

Each invocation consists of:

1. **Minimal HTML** (`glyph.html`)
2. **Auto-loaded markdown**: `entryName.md`
3. **Auto-loaded image**: `entryName.jpg`
4. **Auto-loaded video**: `entryName.mp4` (optional)
5. **Auto-generated title**: from `entryName`
6. **Optional overrides** via `<script data-img data-md data-title>`

---

## ⚙️ Invocation Logic

The JavaScript (`pageweaver.js`) performs:

- **Hash parsing** → `template.html#the-damp-refusal` → `entryName = the-damp-refusal`
- **Markdown loading** → `fragments/the-damp-refusal.md`
- **Image loading** → `fragments/the-damp-refusal.jpg`
- **Video loading** → `fragments/the-damp-refusal.mp4` (if present)
- **Title formatting** → `The Damp Refusal`
- **Failover** → If media not found, it hides the element

Override any of these by adding attributes to the `<script>` tag:

```html
<script
  src="pageweaver.js"
  data-img="custom.jpg"
  data-md="custom.md"
  data-title="Custom Title">
</script>
