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

  // === VIDEO LOADER (sits under the image, not full-width) ==================
  function insertVideoBlock(baseName, container) {
    const overrideFromAttr = container?.dataset?.video?.trim?.() || "";
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

  // === INTRO/CLOSER PANELS FROM MD ==========================================
  function extractPanel(src, tag) {
    const re = new RegExp(`\\\[${tag}\\\]([\\s\\S]*?)\\\/${tag}\\\]`, "i");
    const m = src.match(re);
    return {
      panel: m ? (m[1] || "").trim() : null,
      rest: m ? (src.replace(re, "").trim()) : src
    };
  }

  function insertPanel(where, mdText) {
    if (!mdText) return;
    const section = document.createElement("section");
    section.className = where === "intro" ? "pw-intro" : "pw-closer";
    section.innerHTML = renderMarkdown(mdText);

    const root = document.getElementById("page-weaver-root") || document.body;
    if (where === "intro") {
      root.insertBefore(section, root.firstChild);
    } else {
      root.appendChild(section);
    }
  }

  // === LOAD MARKDOWN (with intro/closer) ====================================
  fetch(mdUrl, {