"use client";

import { useEffect, useState } from "react";

// Counts the first number in an already-formatted string up from zero on load,
// keeping its prefix/suffix, separators and decimals: "$1,651", "45.4K", "+492", "12.9%".
const NUM = /-?\d[\d,]*(\.\d+)?/;

export function CountUp({ text, duration = 1100, delay = 0 }: { text: string; duration?: number; delay?: number }) {
  const match = text.match(NUM);
  const [shown, setShown] = useState(match ? text.replace(NUM, "0") : text);

  useEffect(() => {
    if (!match || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(text);
      return;
    }
    const raw = match[0];
    const target = Number(raw.replace(/,/g, ""));
    const decimals = match[1] ? match[1].length - 1 : 0;
    const commas = raw.includes(",");
    const fmt = (v: number) => {
      const s = v.toFixed(decimals);
      return commas ? Number(s).toLocaleString("en-AU", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : s;
    };
    let raf = 0;
    let start = 0;
    const step = (t: number) => {
      if (!start) start = t;
      const p = Math.min(Math.max((t - start - delay) / duration, 0), 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(text.replace(NUM, fmt(target * eased)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return <span className="tabular">{shown}</span>;
}
