"use client";

import { useEffect, useRef } from "react";

// Subtle snowfall behind the dashboard. Small, slow, low-opacity flakes with a
// gentle sway. Stops when the tab is hidden; off for reduced-motion users.
export function Snow() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "255, 255, 255";
    const count = Math.round(Math.min(90, (w * h) / 22000));
    const flakes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      speed: 0.15 + Math.random() * 0.45,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.004 + Math.random() * 0.01,
      alpha: 0.15 + Math.random() * 0.45,
      // Mix of accent-coloured and white orbs
      rgb: Math.random() < 0.55 ? accent : "255, 255, 255",
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.sway += f.swaySpeed;
        f.y += f.speed;
        f.x += Math.sin(f.sway) * 0.3 + 0.08;
        if (f.y > h + 4) {
          f.y = -4;
          f.x = Math.random() * w;
        }
        if (f.x > w + 4) f.x = -4;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${f.rgb},${f.alpha})`;
        ctx.shadowColor = `rgba(${accent},0.9)`;
        ctx.shadowBlur = f.r * 4;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 h-full w-full" />;
}
