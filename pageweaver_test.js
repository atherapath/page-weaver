/* pageweaver_test.js
   - Slideshow only change:
       * Shows fallback Picsum images immediately (no initial blank)
       * Probes for local images: <slug>.(jpg|jpeg|png|webp) and <slug>_2.._6.*
       * If locals exist, swaps to them seamlessly
       * Cycles every 6 seconds
   - Markdown logic: ONLY tries <slug>.md (unchanged otherwise)
   - Video logic: probes for <slug>.mp4 and injects below image in styled box
     * If not found, loads fallback public video and limits playback to 6 seconds
     * Autoplay now works by muting the video
     * Page title and header set from filename, with underscores converted to spaces and words capitalized
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

  // --- Title formatter ---
  const formatTitle = (raw) =>
    raw
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

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

    // --- Set page title and header from filename ---
    const title = formatTitle(slug);
    document.title = title;
    const titleEl = document.getElementById("page-title");
    if (titleEl) titleEl.textContent = title;

    // --- Images: show fallback immediately, then upgrade if locals exist ---
    const hero = document.getElementById("hero-image");
    const caption = document.getElementById("hero-caption");

    let timer = startSlideshow(FALLBACK, hero, caption);

    const locals = await findLocalImages(dir, slug);
    if (locals.length) {
      if (timer) clearInterval(timer);
      timer = startSlideshow(locals, hero, caption);
    }

    // --- Markdown: ONLY <slug>.md ---
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

// --- Top Banner Markdown: <slug>_top.md ---
const bannerEl = document.getElementById("top-banner");
if (bannerEl) {
  try {
    const res = await fetch(`${dir}${slug}_top.md`, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        bannerEl.innerHTML = mdToHtml(text);
      }
    }
  } catch {}
}

// --- Bottom Banner Markdown: <slug>_bottom.md ---
const bottomEl = document.getElementById("bottom-banner");
if (bottomEl) {
  try {
    const res = await fetch(`${dir}${slug}_bottom.md`, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim()) {
        bottomEl.innerHTML = mdToHtml(text);
      }
    }
  } catch {}
}

    // --- Video: probe for <slug>.mp4 or fallback to public test video ---
    const videoContainer = document.getElementById("video-container");
    if (videoContainer) {
      const videoUrl = `${dir}${slug}.mp4`;
      let finalUrl = null;
      try {
        const res = await fetch(videoUrl, { method: "HEAD", cache: "no-store" });
        if (res.ok) {
          finalUrl = videoUrl;
        }
      } catch {}

      if (!finalUrl) {
        finalUrl = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";
      }

      const wrapper = document.createElement("figure");
      wrapper.className = "pw-figure";
      wrapper.style.maxWidth = "600px";
      wrapper.style.margin = "0 auto 18px";

      const videoEl = document.createElement("video");
      videoEl.src = finalUrl;
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.controls = true;
      videoEl.style.width = "100%";
      videoEl.style.border = "1px solid var(--border)";
      videoEl.style.borderRadius = "6px";
      videoEl.style.display = "block";

      videoEl.addEventListener("timeupdate", () => {
        if (videoEl.currentTime >= 6) {
          videoEl.pause();
        }
      });

      const caption = document.createElement("figcaption");
      caption.textContent = "Video loaded by filename convention";
      caption.style.marginTop = "8px";
      caption.style.color = "var(--fg-dim)";
      caption.style.fontSize = ".9rem";
      caption.style.textAlign = "center";
      caption.style.opacity = ".85";

      wrapper.appendChild(videoEl);
      wrapper.appendChild(caption);
      videoContainer.appendChild(wrapper);
    }
  });
})();