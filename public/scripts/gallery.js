/**
 * Gallery client-side scripts
 * Placed in public/ to ensure external file serving (CSP: script-src 'self')
 */

/** GalleryItem: thumbnail → full-size image fallback */
function initGalleryFallback() {
  var images = document.querySelectorAll(".gallery-item img[data-fallback]");

  for (var i = 0; i < images.length; i++) {
    images[i].addEventListener(
      "error",
      function () {
        var fallback = this.dataset.fallback;
        if (fallback && this.src !== fallback) {
          this.src = fallback;
        }
      },
      { once: true },
    );
  }
}

/** GalleryModal: LQIP-based dialog for full-size image viewing */
function initGalleryModal() {
  var dialog = document.getElementById("gallery-modal");
  if (!dialog) return;

  var imgWrap = dialog.querySelector(".gallery-modal__img-wrap");
  var img = dialog.querySelector(".gallery-modal__img");
  var caption = dialog.querySelector(".gallery-modal__caption");
  var closeBtn = dialog.querySelector(".gallery-modal__close");
  var preloader = null;

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery-item");
    if (!btn) return;

    var fullSrc = btn.dataset.src || "";
    var text = btn.dataset.text || "";

    // Get thumbnail element from clicked item
    var thumb = btn.querySelector("img");
    var thumbSrc = thumb ? thumb.currentSrc || thumb.src : fullSrc;

    // Calculate aspect ratio from loaded thumbnail
    var w = thumb && thumb.naturalWidth;
    var h = thumb && thumb.naturalHeight;
    if (w && h) {
      imgWrap.style.aspectRatio = w + " / " + h;
    } else {
      imgWrap.style.aspectRatio = "";
    }

    // Step 1: Show thumbnail as LQIP with blur
    img.classList.remove("is-loaded");
    img.classList.add("is-lqip");
    img.src = thumbSrc;
    img.alt = "";
    caption.textContent = text;
    dialog.showModal();

    // Step 2: Preload full-size image in background
    if (preloader) {
      preloader.onload = null;
      preloader = null;
    }
    preloader = new Image();
    preloader.onload = function () {
      // Step 3: Swap to full-size and remove blur
      img.src = fullSrc;
      img.classList.remove("is-lqip");
      imgWrap.style.aspectRatio = "";
      setTimeout(function () {
        img.classList.add("is-loaded");
      }, 50);
      preloader = null;
    };
    preloader.src = fullSrc;
  });

  closeBtn.addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", function () {
    img.classList.remove("is-loaded");
    img.classList.remove("is-lqip");
    imgWrap.style.aspectRatio = "";
    if (preloader) {
      preloader.onload = null;
      preloader = null;
    }
    img.onload = null;
    img.src = "";
  });
}

/** Gallery: category filter sidebar */
function initGalleryFilters() {
  var buttons = document.querySelectorAll(".gallery__cat-btn");
  var sections = document.querySelectorAll(".gallery__section");
  if (!buttons.length) return;

  function activateCategory(filter) {
    var matched = false;

    buttons.forEach(function (b) {
      var isTarget = b.dataset.filter === filter;
      b.classList.toggle("is-active", isTarget);
      if (isTarget) matched = true;
    });

    sections.forEach(function (section) {
      if (section.dataset.category === filter) {
        section.classList.remove("is-hidden");
        section.style.animation = "none";
        void section.offsetHeight;
        section.style.animation = "";
      } else {
        section.classList.add("is-hidden");
      }
    });

    return matched;
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      activateCategory(btn.dataset.filter || "");
    });
  });

  // Deep-link: /works#<category-id> でカテゴリを直接開く（フッター等のリンク用）
  function syncFromHash() {
    var id = (window.location.hash || "").replace(/^#/, "");
    if (id) activateCategory(id);
  }
  syncFromHash();
  window.addEventListener("hashchange", syncFromHash);
}

initGalleryFallback();
initGalleryModal();
initGalleryFilters();
