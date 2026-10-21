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

  // header state, hero tilt, parallax (only layers near the viewport; reads and writes are batched)
  const hero = d.querySelector(".hero-phone");
  const layers = [...d.querySelectorAll("[data-speed]")];
  const parents = new Map();
  const near = new Set();
  let ticking = false, lastP = -1, stuck = false;
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const update = () => {
    ticking = false;
    const y = scrollY, vh = innerHeight;
    const nowStuck = y > 12;
    if (nowStuck !== stuck) { stuck = nowStuck; header?.classList.toggle("stuck", stuck); }
    if (reduce) return;
    const p = clamp(y / (vh * 0.8), 0, 1);
    if (hero && Math.abs(p - lastP) > 0.003) { lastP = p; hero.style.setProperty("--p", p.toFixed(3)); }
    const reads = [];
    for (const el of near) {
      let host = parents.get(el);
      if (!host) { host = el.offsetParent || el.parentElement; parents.set(el, host); }
      reads.push([el, host.getBoundingClientRect()]);
    }
    for (const [el, r] of reads) {
      el.style.setProperty("--py", ((r.top + r.height / 2 - vh / 2) * parseFloat(el.dataset.speed)).toFixed(1) + "px");
    }
  };
  if (!reduce) {
    const layerIO = new IntersectionObserver((entries) => {
      for (const e of entries) { if (e.isIntersecting) near.add(e.target); else near.delete(e.target); }
      schedule();
    }, { rootMargin: "300px 0px" });
    layers.forEach((l) => layerIO.observe(l));
  }
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  schedule();
})();
