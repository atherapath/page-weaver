# ✨ page-weaver — Ritual HTML Invocation Engine

**page-weaver** is the sacred frame of the Athera Path. It invokes modular fragments—poems, protests, mythic logs—through filename alone. No spectacle. No bloat. Just clean HTML, sovereign CSS, and filename-bound JavaScript.

---

## 🔮 Purpose

This repository contains the **ritual HTML shell** used to summon content fragments into view. It acts as:

- A **mythic threshold**
- A **sacred container**
- A **weaver of fragments** across the archive

Each `.html` file becomes a spell: it auto-loads its own `.jpg`, `.md`, and title based on its name.

---

## 🧱 Structure

Each page consists of:

1. **Minimal HTML** (≈27 lines)
2. **Auto-loaded image**: `filename.jpg`
3. **Auto-loaded markdown**: `filename.md`
4. **Auto-generated title**: from `filename.html`
5. **Optional overrides** via `<script data-img data-md data-title>`

---

## ⚙️ Invocation Logic

The JavaScript (`pageweaver.js`) performs:

- **Filename parsing** → `gas_powered_circus.html` → base = `gas_powered_circus`
- **Image loading** → `gas_powered_circus.jpg`
- **Markdown loading** → `gas_powered_circus.md`
- **Title formatting** → `Gas Powered Circus`
- **Failover** → If image not found, it hides the image and caption

Override any of these by adding attributes to the `<script>` tag:

```html
<script
  src="pageweaver.js"
  data-img="custom.jpg"
  data-md="custom.md"
  data-title="Custom Title">
</script>
