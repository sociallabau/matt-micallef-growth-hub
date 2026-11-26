// A small, stylised map of South East Queensland / Northern NSW with a glowing
// orb on each office, plus a tiny Australia inset showing where the region is.
// Pure SVG (no map tiles); coastline is simplified by hand from real coordinates.

export type Office = { name: string; lat: number; lng: number };

// Map window
const N = -26.95;
const S = -28.48;
const W = 152.72;
const E = 153.78;
const K = 300; // px per degree of latitude
const COS = Math.cos((((N + S) / 2) * Math.PI) / 180);
const WIDTH = (E - W) * COS * K;
const HEIGHT = (N - S) * K;
const px = (lng: number) => (lng - W) * COS * K;
const py = (lat: number) => (N - lat) * K;

// Mainland coastline, north → south ([lat, lng])
const COAST: [number, number][] = [
  [-26.95, 153.13], [-27.08, 153.15], [-27.15, 153.06], [-27.18, 153.03], [-27.19, 153.1],
  [-27.21, 153.12], [-27.26, 153.1], [-27.3, 153.06], [-27.33, 153.08], [-27.38, 153.16],
  [-27.43, 153.17], [-27.48, 153.21], [-27.52, 153.29], [-27.6, 153.3], [-27.68, 153.32],
  [-27.78, 153.36], [-27.9, 153.39], [-27.97, 153.41], [-28.02, 153.43], [-28.09, 153.46],
  [-28.13, 153.49], [-28.17, 153.55], [-28.26, 153.58], [-28.33, 153.57], [-28.39, 153.56],
  [-28.48, 153.56],
];
const ISLANDS: [number, number][][] = [
  // Bribie
  [[-26.97, 153.14], [-27.06, 153.18], [-27.08, 153.2], [-27.02, 153.2], [-26.97, 153.16]],
  // Moreton
  [[-27.03, 153.42], [-27.16, 153.44], [-27.33, 153.43], [-27.42, 153.42], [-27.38, 153.37], [-27.2, 153.38], [-27.06, 153.39]],
  // North Stradbroke
  [[-27.42, 153.5], [-27.5, 153.55], [-27.62, 153.53], [-27.73, 153.47], [-27.68, 153.42], [-27.52, 153.42], [-27.44, 153.44]],
  // South Stradbroke
  [[-27.76, 153.43], [-27.88, 153.43], [-27.95, 153.43], [-27.95, 153.42], [-27.78, 153.41]],
];
// QLD / NSW border (simplified)
const BORDER: [number, number][] = [[-28.17, 153.55], [-28.2, 153.3], [-28.26, 153.05], [-28.3, 152.72]];

const toPath = (pts: [number, number][]) => pts.map(([lat, lng], i) => `${i ? "L" : "M"}${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join("");
const LAND = `${toPath(COAST)}L0,${HEIGHT}L0,0Z`;

// Australia outline for the inset ([lng, lat]), very simplified
const AUS: [number, number][] = [
  [113.4, -22], [114.1, -26.4], [115, -29.5], [115, -33.6], [116, -35], [118, -35], [121, -33.8], [124, -33.9],
  [126, -32.3], [129, -31.6], [131.1, -31.5], [134.2, -32.7], [135.6, -34.8], [137.8, -33], [138, -35.6],
  [140, -37.5], [143.5, -38.8], [146.3, -39.1], [148, -37.8], [150, -37.5], [150.1, -35.6], [151.2, -33.9],
  [152.5, -32.4], [153.1, -30.3], [153.6, -28.6], [153.1, -26], [153.1, -25], [151.6, -24], [150.8, -22.6],
  [149.3, -21.2], [146.3, -19], [145.4, -16], [145.3, -14.9], [143.6, -14], [142.5, -10.7], [141.6, -12.9],
  [141.5, -15.5], [140.8, -17.5], [139.3, -17.4], [137, -15.9], [135.9, -15.1], [136.9, -12.3], [136.6, -11.9],
  [132.6, -11.5], [131, -12.2], [130, -13.4], [129.4, -14.9], [128, -15], [126.6, -13.9], [125, -14.6],
  [123.5, -16.6], [122.2, -18.2], [120.9, -19.6], [118.8, -20.3], [116.8, -20.6], [114.6, -21.8],
];
const AK = 3.2; // inset px per degree
const ax = (lng: number) => (lng - 112.5) * AK;
const ay = (lat: number) => (-10 - lat) * AK;
const AUS_PATH = AUS.map(([lng, lat], i) => `${i ? "L" : "M"}${ax(lng).toFixed(1)},${ay(lat).toFixed(1)}`).join("") + "Z";

/** Thin landscape strip: title + Australia inset · mini SEQ map with pins · office list. */
export function OfficeMap({ offices, title = "Core Suburbs", region = "SEQ" }: { offices: Office[]; title?: string; region?: string }) {
  const sorted = [...offices].sort((a, b) => b.lat - a.lat); // north → south

  return (
    <div className="glow animate-rise flex flex-col gap-5 rounded-xl border px-5 py-4 sm:flex-row sm:items-center sm:gap-8">
      {/* Title + where in Australia */}
      <div className="flex shrink-0 items-center gap-4">
        <svg viewBox={`0 0 ${ax(154.5)} ${ay(-40)}`} className="h-16 w-auto" aria-hidden>
          <defs>
            <radialGradient id="orb" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="35%" stopColor="rgb(var(--accent-rgb))" />
              <stop offset="100%" stopColor="rgb(var(--accent-rgb))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <path d={AUS_PATH} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} strokeLinejoin="round" />
          <circle cx={ax(153.2)} cy={ay(-27.7)} r={9} fill="url(#orb)" className="orb-pulse" />
          <circle cx={ax(153.2)} cy={ay(-27.7)} r={2.2} fill="#fff" />
        </svg>
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{title}</h2>
          <p className="mt-1 text-sm">{region}</p>
          <p className="text-xs text-muted">
            {offices.length} suburbs
          </p>
        </div>
      </div>

      {/* Mini map */}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="hidden h-28 w-auto shrink-0 sm:block"
        role="img"
        aria-label={`Map of core suburbs: ${sorted.map((o) => o.name).join(", ")}`}
      >
        <path d={LAND} fill="rgba(255,255,255,0.05)" />
        <path d={toPath(COAST)} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={3} strokeLinejoin="round" />
        {ISLANDS.map((isl, i) => (
          <path key={i} d={`${toPath(isl)}Z`} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.25)" strokeWidth={2.5} />
        ))}
        <path d={toPath(BORDER)} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={2.5} strokeDasharray="10 10" />
        {sorted.map((o, i) => (
          <g key={o.name}>
            <title>{o.name}</title>
            <circle cx={px(o.lng)} cy={py(o.lat)} r={30} fill="url(#orb)" className="orb-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
            <circle cx={px(o.lng)} cy={py(o.lat)} r={8} fill="#fff" />
          </g>
        ))}
      </svg>

      {/* Office list */}
      <ul className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {sorted.map((o, i) => (
          <li key={o.name} className="flex items-center gap-2.5">
            <span className="relative grid size-4 shrink-0 place-items-center">
              <span
                className="orb-pulse absolute inset-0 rounded-full"
                style={{
                  background: "radial-gradient(circle, #fff 0%, rgb(var(--accent-rgb)) 40%, transparent 70%)",
                  animationDelay: `${i * 0.4}s`,
                }}
              />
              <span className="relative size-1.5 rounded-full bg-white" />
            </span>
            <span className="text-sm font-medium">{o.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
