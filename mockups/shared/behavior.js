/* Behaviour shared by all three mockups. Each page opts in by adding the
   relevant data-attributes; nothing here assumes a particular design. */

(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- i18n ---------------------------------------------------------------
     English is filled in; Arabic is an intentionally empty stub. The toggle is
     wired now so the RTL layout can be smoke-tested before any translation
     exists: switching to `ar` flips <html dir> and leaves the English text. */

  var STRINGS = {
    en: {
      "nav.login": "Member login",
      "nav.menu": "Menu",
      "nav.close": "Close menu",
      "search.submit": "Search",
      "search.noResults": "No matches. Try a cuisine, a city, or an area.",
      "rail.prev": "Previous",
      "rail.next": "Next",
      "news.all": "All news and events",
      "newsletter.email": "Email address",
      "newsletter.interests": "What should we send you?",
    },
    ar: {},
  };

  function applyLang(code) {
    var dict = STRINGS[code] || {};
    var root = document.documentElement;
    root.setAttribute("lang", code);
    root.setAttribute("dir", code === "ar" ? "rtl" : "ltr");
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n")];
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-label]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-label")];
      if (v) el.setAttribute("aria-label", v);
    });
    document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
      btn.textContent = code === "ar" ? "English" : "عربي";
      btn.setAttribute("aria-pressed", String(code === "ar"));
    });
  }

  document.querySelectorAll("[data-lang-toggle]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(document.documentElement.getAttribute("dir") === "rtl" ? "en" : "ar");
    });
  });

  /* --- scroll reveal ------------------------------------------------------- */

  var revealables = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    revealables.forEach(function (el) { revealObserver.observe(el); });
  }

  /* --- stat counters ------------------------------------------------------- */

  function formatNumber(n, decimals) {
    return decimals
      ? n.toFixed(decimals)
      : Math.round(n).toLocaleString("en-US");
  }

  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var decimals = parseInt(el.dataset.decimals || "0", 10);
    if (reduced) { el.textContent = formatNumber(target, decimals); return; }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      // ease-out cubic: fast start, settles gently on the final figure
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatNumber(target * eased, decimals);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCounter);
    } else {
      var countObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* --- carousel rails ------------------------------------------------------ */

  document.querySelectorAll("[data-rail-prev], [data-rail-next]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = btn.dataset.railPrev || btn.dataset.railNext;
      var rail = document.querySelector(sel);
      if (!rail) return;
      var first = rail.firstElementChild;
      var step = first ? first.getBoundingClientRect().width + 24 : rail.clientWidth * 0.8;
      // scrollLeft is negative in RTL, so the sign follows the document direction
      var dir = document.documentElement.getAttribute("dir") === "rtl" ? -1 : 1;
      rail.scrollBy({
        left: dir * step * (btn.dataset.railPrev ? -1 : 1),
        behavior: reduced ? "auto" : "smooth",
      });
    });
  });

  /* --- slide decks (membership band) --------------------------------------- */

  document.querySelectorAll("[data-deck]").forEach(function (deck) {
    var slides = Array.prototype.slice.call(deck.querySelectorAll("[data-slide]"));
    var counter = deck.querySelector("[data-deck-count]");
    var index = 0;

    function show(i) {
      index = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        var active = n === index;
        s.hidden = !active;
        s.setAttribute("aria-hidden", String(!active));
      });
      if (counter) counter.textContent = (index + 1) + " / " + slides.length;
    }

    deck.querySelectorAll("[data-deck-prev]").forEach(function (b) {
      b.addEventListener("click", function () { show(index - 1); });
    });
    deck.querySelectorAll("[data-deck-next]").forEach(function (b) {
      b.addEventListener("click", function () { show(index + 1); });
    });
    show(0);
  });

  /* --- directory search ----------------------------------------------------
     Matches against restaurant names, cuisines, cities and features so the
     hero field behaves like the real directory search will. */

  function buildIndex() {
    if (typeof JRA_DATA === "undefined") return [];
    var out = JRA_DATA.restaurants.map(function (r) {
      return {
        label: r.name,
        meta: r.cuisine + " · " + r.city,
        haystack: [r.name, r.cuisine, r.city, r.address].concat(r.tags).join(" ").toLowerCase(),
      };
    });
    JRA_DATA.cuisines.forEach(function (c) {
      out.push({ label: c, meta: "Cuisine", haystack: c.toLowerCase() });
    });
    JRA_DATA.cities.forEach(function (c) {
      out.push({ label: c, meta: "Governorate", haystack: c.toLowerCase() });
    });
    JRA_DATA.features.forEach(function (f) {
      out.push({ label: f, meta: "Feature", haystack: f.toLowerCase() });
    });
    return out;
  }

  var index = buildIndex();

  document.querySelectorAll("[data-search]").forEach(function (input) {
    var panel = document.querySelector(input.dataset.search);
    if (!panel) return;

    function close() {
      panel.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }

    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      if (q.length < 2) { close(); return; }
      var hits = index.filter(function (item) {
        return item.haystack.indexOf(q) !== -1;
      }).slice(0, 6);

      panel.innerHTML = hits.length
        ? hits.map(function (h) {
            return '<li><button type="button" class="tap"><span>' + h.label +
              '</span><small>' + h.meta + "</small></button></li>";
          }).join("")
        : '<li class="is-empty">' + STRINGS.en["search.noResults"] + "</li>";

      panel.hidden = false;
      input.setAttribute("aria-expanded", "true");

      panel.querySelectorAll("button").forEach(function (b, i) {
        b.addEventListener("click", function () {
          input.value = hits[i].label;
          close();
          input.focus();
        });
      });
    });

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { close(); }
    });

    document.addEventListener("click", function (e) {
      if (!panel.contains(e.target) && e.target !== input) close();
    });
  });

  /* --- mobile nav ---------------------------------------------------------- */

  document.querySelectorAll("[data-nav-toggle]").forEach(function (btn) {
    var target = document.querySelector(btn.dataset.navToggle);
    if (!target) return;
    btn.addEventListener("click", function () {
      var open = target.hasAttribute("hidden");
      if (open) { target.removeAttribute("hidden"); } else { target.setAttribute("hidden", ""); }
      btn.setAttribute("aria-expanded", String(open));
      document.body.style.overflow = open ? "hidden" : "";
    });
    target.addEventListener("click", function (e) {
      if (e.target.tagName !== "A") return;
      target.setAttribute("hidden", "");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });

  /* --- sticky header state -------------------------------------------------- */

  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  applyLang("en");
})();
