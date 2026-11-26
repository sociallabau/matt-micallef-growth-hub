"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import type { MonthPoint } from "@/lib/airtable";

// One metric per chart (no legend, no dual axis). Followers is a running total,
// so it's a line; views and interactions are per-month amounts, so they're bars.
// Months before onboarding are grey; the current month is faded (still in progress).

type Metric = "followers" | "views" | "interactions";
const LABEL: Record<Metric, string> = { followers: "followers", views: "views", interactions: "interactions" };

const compact = new Intl.NumberFormat("en-AU", { notation: "compact", maximumFractionDigits: 1 });
const full = new Intl.NumberFormat("en-AU");
const mon = (iso: string) => new Intl.DateTimeFormat("en-AU", { month: "short" }).format(new Date(iso));
const monYear = (iso: string) => new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" }).format(new Date(iso));

function niceMax(v: number) {
  if (v <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(v));
  return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].map((m) => m * mag).find((s) => s >= v) ?? 10 * mag);
}

export function MonthlyChart({ points, metric, height = 120 }: { points: MonthPoint[]; metric: Metric; height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const clipId = `reveal-${useId().replace(/:/g, "")}`;
  const [still, setStill] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (points.length < 2) {
    return <p className="rounded-lg border border-dashed border-line px-3 py-5 text-center text-xs text-muted">Not enough monthly data yet.</p>;
  }

  const isLine = metric === "followers";
  const pad = { t: 14, r: 4, b: 18, l: 34 };
  // Followers of 0 = not recorded: leave a gap instead of plunging to zero.
  const missing = (p: MonthPoint) => isLine && p[metric] <= 0;
  const values = points.filter((p) => !missing(p)).map((p) => p[metric]);
  if (!values.length) values.push(0);
  const lo = isLine ? Math.max(0, Math.floor((Math.min(...values) * 0.9) / 10) * 10) : 0;
  const hi = niceMax(Math.max(...values));
  const innerW = Math.max(width - pad.l - pad.r, 10);
  const slot = innerW / points.length;
  const cx = (i: number) => pad.l + slot * (i + 0.5);
  const y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo || 1)) * (height - pad.t - pad.b);
  const firstSince = points.findIndex((p) => !p.before);
  const divider = firstSince > 0 ? pad.l + slot * firstSince : null;
  const barW = Math.max(Math.min(slot - 6, 28), 4);

  const tone = (p: MonthPoint) => (p.before ? "var(--muted)" : "var(--fg)");

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const px = e.clientX - e.currentTarget.getBoundingClientRect().left;
    setHover(Math.min(points.length - 1, Math.max(0, Math.floor(px / slot))));
  };

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" role="img" aria-label={`Monthly ${LABEL[metric]}`}>
          {[lo, (lo + hi) / 2, hi].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={pad.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="tabular fill-muted text-[10px]">
                {compact.format(t)}
              </text>
            </g>
          ))}

          {divider != null && (
            <g>
              <line x1={divider} x2={divider} y1={pad.t - 6} y2={height - pad.b} stroke="var(--muted)" strokeDasharray="3 3" />
              <text x={divider + 4} y={pad.t - 4} className="fill-muted text-[10px]">
                Onboarded
              </text>
            </g>
          )}

          {isLine ? (
            <>
              {/* Draws the line left → right on load */}
              {!still && (
                <defs>
                  <clipPath id={clipId}>
                    <rect x={0} y={0} height={height} width={0}>
                      <animate attributeName="width" from="0" to="100%" dur="1.3s" begin="0.15s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.2 0.7 0.2 1" />
                    </rect>
                  </clipPath>
                </defs>
              )}
              <g clipPath={still ? undefined : `url(#${clipId})`}>
              {points.slice(1).map((p, k) => {
                const i = k + 1;
                const prev = points[i - 1];
                if (missing(p) || missing(prev)) return null;
                return (
                  <line
                    key={p.month}
                    x1={cx(i - 1)}
                    y1={y(prev[metric])}
                    x2={cx(i)}
                    y2={y(p[metric])}
                    stroke={tone(p)}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray={p.before ? "4 4" : undefined}
                    className={p.before ? undefined : "glow-line"}
                  />
                );
              })}
              </g>
              {points.map((p, i) =>
                missing(p) ? null : (
                <circle
                  className="fade-in"
                  style={{ animationDelay: `${300 + i * 160}ms` }}
                  key={p.month}
                  cx={cx(i)}
                  cy={y(p[metric])}
                  r={i === hover ? 5 : 3.5}
                  fill={tone(p)}
                  stroke="var(--surface)"
                  strokeWidth={2}
                  opacity={p.partial ? 0.6 : 1}
                />
                ),
              )}
            </>
          ) : (
            points.map((p, i) => {
              const top = y(p[metric]);
              const h = Math.max(y(0) - top, p[metric] > 0 ? 2 : 0);
              const r = Math.min(4, barW / 2, h);
              const x0 = cx(i) - barW / 2;
              // Rounded top only, anchored to the baseline.
              const d = `M${x0},${y(0)}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${y(0)}Z`;
              return (
                <path
                  key={p.month}
                  d={d}
                  className={`bar-grow ${p.before ? "" : "glow-line"}`}
                  style={{ animationDelay: `${100 + i * 70}ms` }}
                  fill={tone(p)}
                  fillOpacity={p.partial ? 0.2 : p.before ? 0.55 : 1}
                  stroke={p.partial ? "var(--fg)" : "none"}
                  strokeDasharray={p.partial ? "3 2" : undefined}
                  opacity={hover == null || hover === i ? 1 : 0.6}
                />
              );
            })
          )}

          {points.map((p, i) => {
            // With a year+ of months, label every other month (always the latest) and add the year on January / the first month.
            const last = points.length - 1;
            if (points.length > 9 && (last - i) % 2 !== 0) return null;
            const showYear = points.length > 9 && (i === 0 || p.month.slice(5, 7) === "01");
            return (
              <text key={p.month} x={cx(i)} y={height - 4} textAnchor="middle" className="fill-muted text-[10px]">
                {mon(p.month)}
                {showYear ? ` ’${p.month.slice(2, 4)}` : ""}
              </text>
            );
          })}

          <rect
            x={pad.l}
            y={0}
            width={innerW}
            height={height}
            fill="transparent"
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}

      {hover != null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg"
          style={{
            top: -6,
            left: cx(hover) > width / 2 ? undefined : cx(hover) + 8,
            right: cx(hover) > width / 2 ? width - cx(hover) + 8 : undefined,
          }}
        >
          <p className="font-medium">
            {monYear(points[hover].month)}
            {points[hover].partial && <span className="font-normal text-muted"> · to date</span>}
          </p>
          <p className="tabular">
            {missing(points[hover]) ? "Not recorded" : `${full.format(points[hover][metric])} ${LABEL[metric]}`}
            {metric !== "followers" && " that month"}
          </p>
          <p className="text-muted">{points[hover].before ? "Before onboarding" : "Since onboarding"}</p>
        </div>
      )}
    </div>
  );
}
