/* pageweaver_test.js
   - Sets page <title> and #page-title from filename
   - Builds an image chain for #hero-image by probing base + _2.._6 across .jpg/.jpeg/.png/.webp
   - If none are found locally, uses six hard-coded fallback web images
   - Runs slideshow (6s each)
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
      img.src = url + (url.includes("?") ?