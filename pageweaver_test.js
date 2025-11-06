/* pageweaver_test.js
   - Sets page <title> and #page-title from the HTML filename
   - Builds an image chain for #hero-image by probing base + _2.._6 across common extensions
   - Runs a 6s slideshow if multiple images are found
   - Optionally renders markdown (<filename>.md or test_image_chain.md) into #md-content
*/

(() => {
  const $ = (sel) => document.querySelector(sel);

  const getFileContext = () => {
    const url = new URL(window.location.href);
    const path = url.pathname;
    const dir = path.substring(0, path.lastIndexOf("/") + 1);
    const file = path.substring(path.lastIndexOf("/") + 1);
    const dot = file.lastIndexOf(".");
    const nameNoExt = dot > -1 ? file.substring(0, dot) : file;
    return { dir, file, nameNoExt };
  };

  const toTitle = (slug) => {
    const spaced = slug.replace(/[_-]+/g, " ").trim();
    return spaced.replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
  };

  const probeImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ url, ok: true });
      img.onerror = () => resolve({ url, ok: false });
      img.decoding = "async";
      img.src = url + (url.includes("?") ? "&" : "?") + "v=" + Date.now();
    });

  const findExistingInOrder = async (candidates) => {
    const found = [];
    for (const url of candidates) {
      const res = await probeImage(url);
      if (res.ok) found.push(res.url);
    }
    return found;
  };

  const mdToHtml = (md) => {
    const esc = md
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    let html = esc
      .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
      .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
      .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>");

    html = html
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+?)`/g, "<code>$1</code>");

    html = html.replace(
      /\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    html = html
      .split(/\n{2,}/)
      .map((chunk) => {
        if (/^<h\d>/.test(chunk)) return chunk;
        if (/^\s*[-*] /.test(chunk)) {
          const items = chunk
            .split(/\n/)
            .map((l) => l.replace(/^\s*[-*] /, ""))
            .map((li) => `<li>${li}</li>`)
            .join("");
          return `<ul>${items}</ul>`;
        }
        return `<p>${chunk.replace(/\n/g, "<br>")}</p>`;
      })
      .join("\n");

    return html;
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const { dir, nameNoExt } = getFileContext();

    const titleText = toTitle(nameNoExt);
    document.title = titleText;
    const h1 = $("#page-title");
    if (h1) h1.textContent = titleText;

    const exts = [".jpg", ".jpeg", ".png", ".webp"];
    const suffixes = ["", "_2", "_3", "_4", "_5", "_6"];
    const candidates = [];
    for (const sfx of suffixes) {
      for (const ext of exts) {
        candidates.push(`${dir}${nameNoExt}${sfx}${ext}`);
      }
    }

    const images = await findExistingInOrder(candidates);
    const heroImg = $("#hero-image");
    const heroCaption = $("#hero-caption");

    if (images.length === 0) {
      const fig = heroImg?.closest("figure");
      if (fig) fig.style.display = "none";
    } else if (images.length === 1) {
      heroImg.src = images[0];
      if (heroCaption) heroCaption.textContent = "Single image found";
    } else {
      let i = 0;
      heroImg.src = images[0];
      if (heroCaption)
        heroCaption.textContent = `Image chain slideshow (${images.length} images, 6s each)`;
      setInterval(() => {
        i = (i + 1) % images.length;
        heroImg.src = images[i];
      }, 6000);
    }

    const mdTargets = [`${dir}${nameNoExt}.md`, `${dir}test_image_chain.md`];
    const mdContainer = $("#md-content");

    if (mdContainer) {
      for (const mdUrl of mdTargets) {
        try {
          const res = await fetch(mdUrl, { cache: "no-store" });
          if (res.ok) {
            const text = await res.text();
            if (text && text.trim().length > 0) {
              mdContainer.innerHTML = mdToHtml(text);