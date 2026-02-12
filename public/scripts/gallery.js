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

/** GalleryModal: open/close dialog for full-size image viewing */
function initGalleryModal() {
  var dialog = document.getElementById("gallery-modal");
  if (!dialog) return;

  var img = dialog.querySelector(".gallery-modal__img");
  var caption = dialog.querySelector(".gallery-modal__caption");
  var closeBtn = dialog.querySelector(".gallery-modal__close");

  document.addEventListener("click", function (e) {
    var btn = e.target.closest(".gallery-item");
    if (!btn) return;

    var src = btn.dataset.src || "";
    var text = btn.dataset.text || "";

    img.classList.remove("is-loaded");
    img.src = src;
    img.alt = "";
    caption.textContent = text;
    dialog.showModal();

    var showImage = function () {
      img.classList.add("is-loaded");
    };
    var waitForOpen = function () {
      if (img.complete) {
        showImage();
      } else {
        img.onload = showImage;
      }
    };
    setTimeout(waitForOpen, 800);
  });

  closeBtn.addEventListener("click", function () {
    dialog.close();
  });

  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", function () {
    img.classList.remove("is-loaded");
    img.onload = null;
    img.src = "";
  });
}

/** Gallery: category filter sidebar */
function initGalleryFilters() {
  var buttons = document.querySelectorAll(".gallery__cat-btn");
  var sections = document.querySelectorAll(".gallery__section");

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.dataset.filter || "";

      buttons.forEach(function (b) {
        b.classList.remove("is-active");
      });
      btn.classList.add("is-active");

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
    });
  });
}

initGalleryFallback();
initGalleryModal();
initGalleryFilters();
