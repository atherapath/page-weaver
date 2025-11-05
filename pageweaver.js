(function () {
  const scriptTag = document.currentScript;
  const overrides = {
    md: scriptTag?.dataset?.md || null,
    img: scriptTag?.dataset?.img || null,
    title: scriptTag?.dataset?.title || null
  };

  const base = (() => {
    const path = decodeURIComponent(window.location.pathname);
    const file = path.substring(path.lastIndexOf("/") + 1) || "index.html";
    return file.replace(/\.[^.]+$/, "");
  })();

  function titleFromBase(str) {
    const cleaned = str.replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();
    return cleaned
      .split(" ")
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  const displayTitle = overrides.title || titleFromBase(base);
  const mdUrl = overrides.md || `./${base}.md`;
  const imgUrl = overrides.img || `./${base}.jpg`;

  const titleEl = document.getElementById("page-title");
  const imgEl = document.getElementById("hero-image");
  const capEl = document.getElementById("hero-caption");
  const mdEl = document.getElementById("md-content");

  if (titleEl) titleEl.textContent = displayTitle;
  document.title = displayTitle;

  if (imgEl) {
    imgEl.src = imgUrl;
    imgEl.onerror = () => {
      imgEl.alt = "Image not found for " + base;
      imgEl.style.display = "none";
      if (capEl) capEl.style.display = "none";
    };
  }
  if (capEl) capEl.textContent = "Filename: " + base + ".jpg";

  // === VIDEO LOADER (adds separate green-bordered section under the image) ===
  function insertVideoBlock(baseName, container) {
    const overrideFromAttr =
      container?.dataset?.video?.trim?.() || "";
    const overrideFromGlobal =
      (typeof window !== "undefined" &&
        window.PW_VIDEO_OVERRIDE &&
        String(window.PW_VIDEO_OVERRIDE).trim()) ||
      "";
    const source = overrideFromAttr || overrideFromGlobal || `${baseName}.mp4`;

    if (!source) return;

    fetch(source, { method: "HEAD" })
      .then(res => {
        if (!res.ok) return; // silent skip if not found

        const section = document.createElement("section");
        section.className = "pw-video";
        section.innerHTML = `
          <video
            src="${source}"
            autoplay
            muted
            loop
            playsinline
            preload="metadata"
            aria-label="Short ambient clip for ${baseName}">
          </video>
          <noscript>
            <p><a href="${source}">Download/play the MP4</a></p>
          </noscript>
        `;
        container.appendChild(section);
      })
      .catch(() => {
        // silent skip on network error
      });
  }

// === CHAIN IMAGE CYCLER ===================================================
  (function handleImageChain() {
    if (!imgEl) return;
    const baseName = base.replace(/\.html$/i, "");
    const chain1 = `./${baseName}_chain_1.jpg`;
    const chain2 = `./${baseName}_chain_2.jpg`;

    // Preload both
    [chain1, chain2].forEach(src => {
      const img = new Image();
      img.src = src;
    });

    // Check if both exist, then swap every 6s
    fetch(chain1, { method: "HEAD" })
      .then(r1 => {
        if (!r1.ok) return;
        fetch(chain2, { method: "HEAD" })
          .then(r2 => {
            if (!r2.ok) return;
            let showing = 1;
            setInterval(() => {
              showing = showing === 1 ? 2 : 1;
              imgEl.src = showing === 1 ? chain1 : chain2;
            }, 6000);
          })
          .catch(() => {});
      })
      .catch(() => {});
  })();

  // === LOAD MARKDOWN ========================================================
  fetch(mdUrl, { cache: "no-store" })
    .then(r => (r.ok ? r.text() : Promise.reject(new Error(r.statusText))))
    .then(text => {
      mdEl.innerHTML = renderMarkdown(text);
    })
    .catch(() => {
      mdEl.innerHTML = `<p>No Markdown found for <code>${base}.md</code>.</p>`;
    });

  // === CALL VIDEO BLOCK =====================================================
  // Find the same container that holds the hero image
  const mediaContainer = imgEl?.parentElement;
  if (mediaContainer) insertVideoBlock(base, mediaContainer);

  // === MARKDOWN RENDERER ====================================================
  function renderMarkdown(src) {
    src = src
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    src = src.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);
    src = src.replace(/`([^`]+)`/g, "<code>$1</code>");
    src = src.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    src = src.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    src = src
      .replace(/^###\s+(.*)$/gm, "<h3>$1</h3>")
      .replace(/^##\s+(.*)$/gm, "<h2>$1</h2>")
      .replace(/^#\s+(.*)$/gm, "<h1>$1</h1>");
    src = src.replace(/^\>\s+(.*)$/gm, "<blockquote>$1</blockquote>");
    src = src.replace(/^---$/gm, "<hr>");
    src = src.replace(
      /(^|\n)(\- .*(?:\n\- .*)*)(?=\n|$)/g,
      (_, lead, block) => {
        const lis = block
          .split("\n")
          .map(line => line.replace(/^\- (.*)/, "<li>$1</li>"))
          .join("");
        return `${lead}<ul>${lis}</ul>`;
      }
    );
    const blocks = src.split(/\n{2,}/).map(chunk => {
      if (/^\s*<(h\d|ul|li|pre|blockquote|hr|table|img)/i.test(chunk.trim()))
        return chunk;
      return `<p>${chunk.replace(/\n/g, "<br>")}</p>`;
    });
    return blocks.join("\n");
  }
})();