/* pageweaver_test.js
   - Slideshow only change:
       * Shows fallback Picsum images immediately (no initial blank)
       * Probes for local images: <slug>.(jpg|jpeg|png|webp) and <slug>_2.._6.*
       * If locals exist, swaps to them seamlessly
       * Cycles every 6 seconds
   - Markdown logic: ONLY tries <slug>.md (unchanged otherwise)
*/

(() => {
  const $ = (sel) => document.querySelector(sel);

  // --- Path helpers ---
  const getContext = () => {
    const path = location.pathname;
    const dir = path.slice(0, path.lastIndexOf("/") + 1);
    const file = path.slice(path.lastIndexOf("/") + 1);
    const slug = file.replace(/\.[^.]+$/, "");
    return { dir, slug };
  };

  // --- Image helpers ---
  const probe = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.src = url + (url.includes("?") ? "&" : "?") + "cb=" + Date.now();
    });

  const findLocalImages = async (dir, slug) => {
    const suffixes = ["", "_2", "_3", "_4", "_5", "_6"];
    const exts = [".jpg", ".jpeg", ".png", ".webp"];
    const results = [];
    for (const sfx of suffixes) {
      let found = null;
      for (const ext of exts) {
        // eslint-disable-next-line no-await-in-loop
        const ok = await probe(`${dir}${slug}${sfx}${ext}`);
        if (ok) {
          found = ok;
          break;
        }
      }
      if (found) results.push(found);
    }
    return results;
  };

  // Start a slideshow and return its interval id
  const startSlideshow = (urls, heroEl, captionEl) => {
    if (!heroEl || !urls.length) return null;
    let i = 0;
    const show = () => {
      const u = urls[i];
      heroEl.src = u + (u.includes("?") ? "&" : "?") + "r=" + Math.random().toString(36).slice(2, 7);
    };
    show();
    if (captionEl) captionEl.textContent = `Image chain slideshow (${urls.length} images, 6s each)`;
    return setInterval(() => {
      i = (i + 1) % urls.length;
      show();
    }, 6000);
  };

  const FALLBACK = [
    "https://picsum.photos/seed/pw1/1600/900.jpg",
    "https://picsum.photos/seed/pw2/1600/900.jpg",
    "https://picsum.photos/seed/pw3/1600/900.jpg",
    "https://picsum.photos/seed/pw4/1600/900.jpg",
    "https://picsum.photos/seed/pw5/1600/900.jpg",
    "https://picsum.photos/seed/pw6/1600/900.jpg",
  ];

  // --- Minimal Markdown (ONLY <slug>.md) ---
  const mdToHtml = (md) => {
    const esc = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let html = esc
      .replace(/^###### (.*)$/gm, "<h6>$1</h6>")
      .replace(/^##### (.*)$/gm, "<h5>$1</h5>")
      .replace(/^#### (.*)$/gm, "<h4>$1</h4>")
      .replace(/^### (.*)$/gm, "<h3>$1</h3>")
      .replace(/^## (.*)$/gm, "<h2>$1</h2>")
      .replace(/^# (.*)$/gm, "<h1>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`([^`]+?)`/g, "<code>$1</code>")
      .replace(/\[([^\]]+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
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
    const { dir, slug } = getContext();

    // --- Images: show fallback immediately, then upgrade if locals exist ---
    const hero = document.getElementById("hero-image");
    const caption = document.getElementById("hero-caption");

    let timer = startSlideshow(FALLBACK, hero, caption);

    const locals = await findLocalImages(dir, slug);
    if (locals.length) {
      if (timer) clearInterval(timer);
      timer = startSlideshow(locals, hero, caption);
    }

    // --- Markdown: ONLY <slug>.md (leave behavior as it was) ---
    const mdEl = document.getElementById("md-content");
    if (mdEl) {
      try {
        const res = await fetch(`${dir}${slug}.md`, { cache: "no-store" });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim()) {
            mdEl.innerHTML = mdToHtml(text);
          }
        }
      } catch {}
    }
  });
})();