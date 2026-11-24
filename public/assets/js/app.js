(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  // Mobile nav drawer with Esc close and focus restore
  const toggle = document.querySelector("[data-nav-toggle]");
  const drawer = document.querySelector("[data-mobile-drawer]");
  const closeBtn = document.querySelector("[data-nav-close]");

  if (toggle && drawer) {
    const close = (restore = true) => {
      if (drawer.hidden) return;
      drawer.hidden = true;
      toggle.setAttribute("aria-expanded", "false");
      if (restore) toggle.focus();
    };

    const open = () => {
      drawer.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
      (closeBtn || drawer.querySelector("a, button"))?.focus();
    };

    toggle.addEventListener("click", () => (drawer.hidden ? open() : close()));
    closeBtn?.addEventListener("click", () => close(true));
    drawer.addEventListener("click", (e) => {
      if (e.target === drawer || e.target.closest("a")) close(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.hidden) close(true);
    });
  }

  // Progressive scroll reveal
  const nodes = document.querySelectorAll(".reveal");
  if (nodes.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries, obs) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -24px 0px" }
      );
      nodes.forEach((el) => io.observe(el));
    }
  }

  // Accessible contact form validation + honeypot guard
  const form = document.querySelector("[data-contact-form]");
  if (form) {
    const status = form.querySelector("[data-form-status]");
    const rules = [
      ["#contact-name", (v) => v.length >= 2, "Enter your name (at least 2 characters)."],
      ["#contact-email", (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email address."],
      ["#contact-message", (v) => v.length >= 10, "Share a few details (at least 10 characters)."],
    ];

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const hp = form.querySelector('input[name="company_website"]');
      if (hp && hp.value.trim()) {
        form.reset();
        return;
      }

      let firstBad = null;
      for (const [sel, test, msg] of rules) {
        const input = form.querySelector(sel);
        const err = form.querySelector(`[data-error-for="${input.id}"]`);
        const ok = test(input.value.trim());
        if (err) err.textContent = ok ? "" : msg;
        input.setAttribute("aria-invalid", ok ? "false" : "true");
        if (!ok) firstBad ??= input;
      }

      if (firstBad) {
        status.textContent = "Please review the highlighted fields before sending.";
        status.className = "form-status is-err";
        firstBad.focus();
        return;
      }

      status.textContent = "Message validated. Connect a Worker or form API endpoint to deliver inquiries.";
      status.className = "form-status is-ok";
      form.reset();
    });
  }
})();
