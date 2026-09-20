// Décor d'arrière-plan de la landing : réseaux de points reliés, circuits, symboles de code, formes
// géométriques. Volontairement discret (opacité très basse, placé surtout sur les bords) et purement
// décoratif : invisible pour les lecteurs d'écran, sans effet sur la lecture. Masqué sur mobile.

type Point = [number, number];

const NETWORKS: { color: string; nodes: Point[]; links: [number, number][] }[] = [
  {
    color: "var(--accent)",
    nodes: [[1040, 190], [1160, 280], [1080, 410], [1215, 400]],
    links: [[0, 1], [1, 2], [1, 3]],
  },
  {
    color: "var(--accent-2)",
    nodes: [[60, 215], [170, 265], [115, 360]],
    links: [[0, 1], [1, 2]],
  },
  {
    color: "var(--accent-2)",
    nodes: [[55, 660], [165, 730], [110, 850], [265, 810], [45, 940]],
    links: [[0, 1], [1, 2], [1, 3], [2, 4]],
  },
  {
    color: "var(--accent)",
    nodes: [[1010, 800], [1120, 735], [1215, 840], [1060, 930]],
    links: [[0, 1], [1, 2], [0, 3]],
  },
];

const CIRCUITS = [
  "M 12 330 H 110 V 400 H 190",
  "M 1268 560 H 1190 V 640 H 1120",
  "M 330 960 H 250 V 900",
];

const GLYPHS: { t: string; x: number; y: number; size: number }[] = [
  { t: "{ }", x: 34, y: 290, size: 32 },
  { t: "</>", x: 1170, y: 470, size: 28 },
  { t: "=>", x: 330, y: 905, size: 24 },
  { t: "[ ]", x: 1200, y: 195, size: 26 },
  { t: "01", x: 60, y: 590, size: 22 },
];

export function TechBackdrop() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1280 1000"
      className="absolute top-0 left-1/2 -translate-x-1/2 w-[1280px] h-[1000px] max-w-none pointer-events-none hidden md:block z-0"
    >
      <defs>
        <pattern id="tech-dots" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1" fill="#8890a0" />
        </pattern>
      </defs>

      <g opacity="0.26">
        <rect x="20" y="500" width="150" height="70" fill="url(#tech-dots)" />
        <rect x="960" y="940" width="250" height="56" fill="url(#tech-dots)" />

        {CIRCUITS.map((d) => (
          <g key={d} stroke="#8890a0" strokeWidth="1" fill="none" strokeLinejoin="round">
            <path d={d} />
          </g>
        ))}

        {NETWORKS.map((net, n) => (
          <g key={n}>
            {net.links.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={net.nodes[a][0]}
                y1={net.nodes[a][1]}
                x2={net.nodes[b][0]}
                y2={net.nodes[b][1]}
                stroke={net.color}
                strokeWidth="1"
              />
            ))}
            {net.nodes.map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={i % 3 === 0 ? 3.5 : 2.5}
                fill={net.color}
                className="tech-node"
                style={{ animationDelay: `${(n * 1.3 + i * 0.9).toFixed(1)}s` }}
              />
            ))}
          </g>
        ))}

        <g fill="none" stroke="#8890a0" strokeWidth="1">
          <rect x="642" y="207" width="16" height="16" transform="rotate(45 650 215)" />
          <polygon points="1240,380 1253,387.5 1253,402.5 1240,410 1227,402.5 1227,387.5" />
          <circle cx="300" cy="330" r="9" />
          <polygon points="905,610 915,628 895,628" />
          <rect x="1246" y="330" width="14" height="14" />
          <circle cx="520" cy="950" r="6" />
          <path d="M 700 560 v 12 M 694 566 h 12" />
          <path d="M 420 870 v 12 M 414 876 h 12" />
        </g>

        <g fill="#8890a0" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {GLYPHS.map((g) => (
            <text key={g.t} x={g.x} y={g.y} fontSize={g.size} opacity="0.7">
              {g.t}
            </text>
          ))}
        </g>
      </g>
    </svg>
  );
}
