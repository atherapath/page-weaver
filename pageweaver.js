document.addEventListener("DOMContentLoaded", () => {
  const entryName = window.location.hash.slice(1);
  if (!entryName) return;

  const titleEl = document.getElementById("page-title");
  const mdBlock = document.getElementById("markdown-block");
  const mediaBlock = document.getElementById("media-block");

  const basePath = "glyphs"; // 🔁 updated folder name
  const mdPath = `${basePath}/${entryName}.md`;
  const imgPath = `${basePath}/${entryName}.jpg`;
  const videoPath = `${basePath}/${entryName}.mp4`;

  const titleText = formatTitle(entryName);
  document.title = titleText;
  titleEl.textContent = titleText;

  // Load markdown
  fetch(mdPath)
    .then(res => res.ok ? res.text() : Promise.reject("Markdown not found"))
    .then(text => {
      mdBlock.textContent = text;
    })
    .catch(() => {
      mdBlock.textContent = "⚠️ Markdown glyph not found.";
    });

  // Load image
  const img = new Image();
  img.src = imgPath;
  img.alt = titleText;
  img.onload = () => mediaBlock.appendChild(img);
  img.onerror = () => console.warn("⚠️ Image glyph not found");

  // Load video (optional)
  fetch(videoPath, { method: "HEAD" })
    .then(res => {
      if (res.ok) {
        const video = document.createElement("video");
        video.src = videoPath;
        video.controls = true;
        mediaBlock.appendChild(video);
      }
    })
    .catch(() => console.warn("⚠️ Video glyph not found"));
});

function formatTitle(name) {
  return name
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}
