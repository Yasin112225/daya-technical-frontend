/* Daya Technical — minimal, progressively enhanced interactions. */
(function () {
  "use strict";

  var doc = document;

  /* Mobile navigation ----------------------------------------------------- */
  var toggle = doc.querySelector("[data-nav-toggle]");
  var mobileNav = doc.querySelector("[data-mobile-nav]");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var expanded = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!expanded));
      mobileNav.classList.toggle("is-open", !expanded);
    });
    doc.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileNav.classList.contains("is-open")) {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
        toggle.focus();
      }
    });
  }

  /* Reveal on scroll ------------------------------------------------------ */
  var reveals = doc.querySelectorAll(".reveal");
  if (reveals.length) {
    if (!("IntersectionObserver" in window)) {
      Array.prototype.forEach.call(reveals, function (el) {
        el.classList.add("is-visible");
      });
    } else {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
      );
      Array.prototype.forEach.call(reveals, function (el) {
        observer.observe(el);
      });
    }
  }

  /* Dismissible alerts ---------------------------------------------------- */
  var alerts = doc.querySelectorAll("[data-dismiss]");
  Array.prototype.forEach.call(alerts, function (alert) {
    var close = alert.querySelector("[data-dismiss-button]");
    if (close) {
      close.addEventListener("click", function () {
        alert.remove();
      });
    }
    window.setTimeout(function () {
      if (alert.parentNode) {
        alert.style.transition = "opacity .4s ease";
        alert.style.opacity = "0";
        window.setTimeout(function () {
          if (alert.parentNode) alert.remove();
        }, 420);
      }
    }, 8000);
  });

  /* Error summary focus --------------------------------------------------- */
  var errorSummary = doc.querySelector(".form-errors");
  if (errorSummary) {
    errorSummary.setAttribute("tabindex", "-1");
    errorSummary.focus({ preventScroll: true });
  }

  /* Appearance (system / light / dark) ------------------------------------ */
  var THEME_KEY = "daya-theme";
  var THEME_ORDER = ["system", "light", "dark"];
  var themeButton = doc.querySelector("[data-theme-toggle]");
  var themeStatus = doc.querySelector("[data-theme-status]");
  var themeMeta = doc.querySelector("meta[data-theme-color]");
  var themeRoot = doc.documentElement;
  var themeMedia = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;
  var themeLabels = themeButton
    ? {
        system: themeButton.getAttribute("data-label-system") || "System",
        light: themeButton.getAttribute("data-label-light") || "Light",
        dark: themeButton.getAttribute("data-label-dark") || "Dark",
      }
    : {};

  function currentThemePreference() {
    var value = themeRoot.getAttribute("data-theme-preference");
    return THEME_ORDER.indexOf(value) === -1 ? "system" : value;
  }

  function resolvedTheme(preference) {
    if (preference === "system") {
      return themeMedia && themeMedia.matches ? "dark" : "light";
    }
    return preference;
  }

  function applyTheme(preference, persist) {
    var theme = resolvedTheme(preference);
    themeRoot.setAttribute("data-theme", theme);
    themeRoot.setAttribute("data-theme-preference", preference);

    if (persist) {
      try {
        window.localStorage.setItem(THEME_KEY, preference);
      } catch (error) {}
    }

    if (themeButton) {
      var label = themeLabels[preference] || preference;
      themeButton.setAttribute("aria-label", label);
      themeButton.setAttribute("title", label);
      themeButton.setAttribute("data-state", preference);
    }
    if (themeStatus) {
      themeStatus.textContent = themeLabels[preference] || "";
    }
    if (themeMeta) {
      themeMeta.setAttribute("content", theme === "dark" ? "#08131d" : "#ffffff");
    }
  }

  if (themeButton) {
    themeButton.addEventListener("click", function () {
      var index = THEME_ORDER.indexOf(currentThemePreference());
      applyTheme(THEME_ORDER[(index + 1) % THEME_ORDER.length], true);
    });
  }

  if (themeMedia) {
    var syncSystemTheme = function () {
      if (currentThemePreference() === "system") {
        applyTheme("system", false);
      }
    };
    if (themeMedia.addEventListener) {
      themeMedia.addEventListener("change", syncSystemTheme);
    } else if (themeMedia.addListener) {
      themeMedia.addListener(syncSystemTheme);
    }
  }

  applyTheme(currentThemePreference(), false);
})();
