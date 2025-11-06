/* pageweaver_test.js
   - Image chain from local files based on the HTML filename:
       <slug>.(jpg|jpeg|png|webp),
       <slug>_2.*, <slug>_3.*, <slug>_4.*, <slug>_5.*, <slug>_6.*
   - If none exist, fall back to 6 random Picsum JPEGs.
   - Rotates the hero image every 6 seconds.
   - Does NOT touch markdown rendering.
*/

(() => {
  const $ = (sel) => document.querySelector(sel);

  // Extract directory and slug (filename without extension) from current URL
  const getFileContext = () => {
    const path = location.pathname;
    const dir = path.slice(0, path.lastIndexOf("/") + 1);
    const file = path.slice(path.lastIndexOf("/") + 1);
    const dot = file.lastIndexOf(".");
    const nameNoExt = dot >= 0 ? file.slice(0, dot) : file;
    return { dir, nameNoExt };
  };

  // Probe a single URL by attempting to load it as an Image
  const probeUrl = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => resolve(null);
      img.decoding = "async";
      img.referrerPolicy = "no-referrer";
      img.src = url + (url.includes("?") ? "&" : "?") + "ts=" + Date.now(); // bust cache while testing
    });

  // For a given suffix, try extensions in order; return the first that exists (or null)
  const firstExistingForSuffix = async ({ dir, slug, suffix, exts }) => {
    for (const ext of exts) {
      const url = `${dir}${slug}${suffix}${ext}`;
      const ok = await probeUrl(url);
      if (ok) return ok;
    }
    return null;
  };

  // Build the ordered local image list: slug, slug_2 ... slug_6 (first existing per suffix)
  const findLocalImages = async ({ dir, slug }) => {
    const suffixes = ["", "_2", "_3", "_4", "_5", "_6"];
    const exts = [".jpg", ".jpeg", ".png", ".webp"];
    const images = [];
    for (const sfx of suffixes) {
      // eslint-disable-next-line no-await-in-loop
      const found = await firstExistingForSuffix({ dir, slug, suffix: sfx, exts });
      if (found) images.push(found);
    }
    return images;
  };

  // If no locals, create six random Picsum JPEGs
  const randomFallbacks = (count = 6) => {
    const seedBase = Date.now();
    const arr = [];
    for (let i = 0; i < count; i++) {
      const seed = `${seedBase}-${i}-${Math.random().toString(36).slice(2, 8)}`;
      arr.push(`https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900.jpg`);
    }
    return arr;
  };

  // Start the slideshow
  const startSlideshow = (urls, heroEl, captionEl) => {
    if (!urls || urls.length === 0 || !heroEl) return;

    let i = 0;
    const setSrc = () => {
      // Add a small cache-buster in case external CDNs are sticky
      heroEl.src = urls[i] + (urls[i].includes("?") ? "&" : "?") + "r=" + Math.random().toString(36).slice(2, 7);
    };

    setSrc();
    if (captionEl) {
      captionEl.textContent = `Image chain slideshow (${urls.length} images, 6s each)`;
    }

    setInterval(() => {
      i = (i + 1) % urls.length;
      setSrc();
    }, 6000);
  };

  document.addEventListener("DOMContentLoaded", async () => {
    const { dir, nameNoExt } = getFileContext();
    const hero = $("#hero-image");
    const caption = $("#hero-caption");

    // Try local images first
    let images = await findLocalImages({ dir, slug: nameNoExt });

    // Fallback to random Picsum set if none found
    if (images.length === 0) {
      images = randomFallbacks(6);
    }

    startSlideshow(images, hero, caption);
  });
})();