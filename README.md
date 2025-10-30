# page-weaver
Ritual HTML template for Athera Path—calls in modular content fragments with sacred clarity.

**page-weaver** is the ritual HTML template engine for the [Athera Path](https://github.com/atherapath). It serves as the foundational frame that calls in modular content fragments—poems, protest pages, mythic archives—without flattening their intent.

## Purpose

This repository contains the core HTML structure used to summon other pages into view. It acts as a sacred shell, a threshold template, and a mythic weaver of fragments. All content pages are created separately and invoked through this frame.

## Features

- Modular HTML invocation via `<iframe>`, `<object>`, or templated includes
- Clean separation of layout and content
- Ritual clarity: no spectacle, no distortion
- Designed for collaborative iteration and mythic resistance

## Usage

Clone or fork this repository into your Athera Path project space. Use `index.html` or your chosen entry point to call in other HTML files stored elsewhere in the archive.

Example invocation:

```html
<object data="fragments/poem1.html" type="text/html"></object>
