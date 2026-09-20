"use client";

import {
  useId,
  useRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

const W = 240;
const H = 340;
const BOTTOM_W = 30;
const KNOB_R = 11;

const widthAt = (y: number) => W - (W - BOTTOM_W) * (y / H);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const euro = (n: number) => `${n.toLocaleString("fr-FR")} €`;

export function FunnelSlider({
  min,
  max,
  step,
  value,
  onChange,
  label,
}: {
  min: number;
  max: number;
  step: number;
  value: number | undefined;
  onChange: (value: number) => void;
  label: string;
}) {
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const hasValue = typeof value === "number";
  const ratio = hasValue ? (value - min) / (max - min) : 0;
  const y = H * (1 - ratio);
  const lineHalf = widthAt(y) / 2;
  const knobY = clamp(y, KNOB_R, H - KNOB_R);

  function setFromPointer(clientY: number) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const r = 1 - clamp((clientY - rect.top) / rect.height, 0, 1);
    const snapped = Math.round((min + r * (max - min)) / step) * step;
    onChange(clamp(snapped, min, max));
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setFromPointer(e.clientY);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (dragging.current) setFromPointer(e.clientY);
  }

  function onPointerEnd() {
    dragging.current = false;
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const current = hasValue ? value : min;
    const deltas: Record<string, number> = {
      ArrowUp: step,
      ArrowRight: step,
      ArrowDown: -step,
      ArrowLeft: -step,
      PageUp: step * 10,
      PageDown: -step * 10,
    };
    let next: number | undefined;
    if (e.key in deltas) next = current + deltas[e.key];
    else if (e.key === "Home") next = min;
    else if (e.key === "End") next = max;
    if (next === undefined) return;
    e.preventDefault();
    onChange(clamp(next, min, max));
  }

  return (
    <div className="flex items-stretch gap-4 sm:gap-6">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation="vertical"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={hasValue ? value : undefined}
        aria-valuetext={hasValue ? euro(value) : "Aucune valeur choisie"}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onKeyDown={onKeyDown}
        className="shrink-0 touch-none select-none cursor-pointer rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-[150px] sm:w-[230px] h-auto block"
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`${uid}-clip`}>
              <polygon
                points={`0,0 ${W},0 ${(W + BOTTOM_W) / 2},${H} ${(W - BOTTOM_W) / 2},${H}`}
              />
            </clipPath>
            <linearGradient id={`${uid}-fill`} x1="0" y1="0" x2="0" y2={H} gradientUnits="userSpaceOnUse">
              <stop offset="0" style={{ stopColor: "var(--accent-2)" }} />
              <stop offset="1" style={{ stopColor: "var(--accent)" }} />
            </linearGradient>
          </defs>

          <polygon
            points={`0,0 ${W},0 ${(W + BOTTOM_W) / 2},${H} ${(W - BOTTOM_W) / 2},${H}`}
            fill="rgba(255,255,255,0.04)"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />

          {hasValue && (
            <g clipPath={`url(#${uid}-clip)`}>
              <rect x="0" y={y} width={W} height={H - y} fill={`url(#${uid}-fill)`} opacity="0.9" />
              <line
                x1={W / 2 - lineHalf}
                x2={W / 2 + lineHalf}
                y1={y}
                y2={y}
                stroke="#F5F6F8"
                strokeWidth="2"
              />
            </g>
          )}

          <circle
            cx={W / 2}
            cy={hasValue ? knobY : H - KNOB_R}
            r={KNOB_R}
            fill="#F5F6F8"
            stroke="var(--accent)"
            strokeWidth="3"
            opacity={hasValue ? 1 : 0.55}
          />
        </svg>
      </div>

      <div className="flex flex-col justify-between py-1 min-w-0">
        <span className="text-xs text-muted-2">{euro(max)}</span>
        <div>
          <div className="font-display text-2xl sm:text-3xl font-semibold text-foreground leading-none">
            {hasValue ? euro(value) : "— €"}
          </div>
          <div className="text-xs text-muted-2 mt-1.5">
            {hasValue ? "par mois" : "Touche ou glisse dans l'entonnoir"}
          </div>
        </div>
        <span className="text-xs text-muted-2">{euro(min)}</span>
      </div>
    </div>
  );
}
