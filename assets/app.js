/* Token System site: vanilla JS, no libraries, no network requests, no cookies, no tracking. */
(() => {
  const d = document;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const header = d.querySelector(".site-header");

  // reveal on scroll
  const reveal = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
    }
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
  d.querySelectorAll("[data-reveal], .pop").forEach((el) => reveal.observe(el));

  // videos: play only while visible; reduced motion keeps the poster
  const play = (v) => {
    if (reduce) return;
    const p = v.play();
    if (p && p.catch) p.catch(() => {});
  };
  const autoVideos = d.querySelectorAll("video[data-auto]");
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) play(e.target); else e.target.pause();
    }
  }, { threshold: 0.35 });
  autoVideos.forEach((v) => seen.observe(v));

  // story: the device on the left follows the chapter on the right
  const story = d.querySelector(".story");
  if (story) {
    const steps = [...story.querySelectorAll(".step")];
    const screens = [...story.querySelectorAll(".sw")];
    const dots = [...story.querySelectorAll(".dots i")];
    let active = -1;
    let storyVisible = false;
    const start = (i) => {
      screens.forEach((el, k) => {
        const on = k === i;
        el.classList.toggle("on", on);
        if (el.tagName === "VIDEO") {
          if (on && storyVisible) { el.currentTime = 0; play(el); } else el.pause();
        } else if (on && storyVisible && !reduce) {
          el.classList.remove("run"); void el.offsetWidth; el.classList.add("run");
        } else {
          el.classList.remove("run");
        }
      });
    };
    const set = (i) => {
      if (i === active) return;
      active = i;
      steps.forEach((s, k) => s.classList.toggle("active", k === i));
      dots.forEach((t, k) => t.classList.toggle("on", k === i));
      start(i);
    };
    const pick = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) set(steps.indexOf(e.target));
    }, { rootMargin: "-42% 0px -42% 0px" });
    steps.forEach((s) => pick.observe(s));
    new IntersectionObserver((entries) => {
      storyVisible = entries[0].isIntersecting;
      const keep = active < 0 ? 0 : active;
      active = -1; set(keep);
    }, { threshold: 0.05 }).observe(story);
    steps.forEach((s, i) => s.addEventListener("click", () => set(i)));
  }

  // horizontal rail
  const rail = d.querySelector(".rail");
  if (rail) {
    const stepPx = () => (rail.querySelector(".fcard")?.getBoundingClientRect().width || 360) + 21;
    d.querySelector("[data-rail-prev]")?.addEventListener("click", () => rail.scrollBy({ left: -stepPx(), behavior: "smooth" }));
    d.querySelector("[data-rail-next]")?.addEventListener("click", () => rail.scrollBy({ left: stepPx(), behavior: "smooth" }));
    let down = false, x0 = 0, s0 = 0;
    rail.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; x0 = e.clientX; s0 = rail.scrollLeft; rail.style.scrollSnapType = "none"; rail.style.cursor = "grabbing";
    });
    addEventListener("pointermove", (e) => { if (down) rail.scrollLeft = s0 - (e.clientX - x0); });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = false; rail.style.scrollSnapType = ""; rail.style.cursor = "";
    });
  }

  // header state, hero tilt, parallax
  const hero = d.querySelector(".hero-phone");
  const layers = [...d.querySelectorAll("[data-speed]")];
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    header?.classList.toggle("stuck", y > 12);
    if (reduce) return;
    hero?.style.setProperty("--p", clamp(y / (vh * 0.8), 0, 1).toFixed(3));
    for (const el of layers) {
      const r = (el.offsetParent || el.parentElement).getBoundingClientRect();
      if (r.bottom < -400 || r.top > vh + 400) continue;
      el.style.setProperty("--py", ((r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed)).toFixed(1) + "px");
    }
  };
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener("resize", update);
  update();
})();
