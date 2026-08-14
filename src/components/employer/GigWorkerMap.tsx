import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "@/types/api";

/** Rough continental-US projection for demo map pins. */
function project(lat: number, lng: number, w: number, h: number) {
  const x = ((lng + 125) / 58) * w;
  const y = ((49.5 - lat) / 25) * h;
  return {
    x: Math.min(w - 8, Math.max(8, x)),
    y: Math.min(h - 8, Math.max(8, y)),
  };
}

export default function GigWorkerMap({
  candidates,
  onSelect,
}: {
  candidates: Candidate[];
  onSelect?: (id: string) => void;
}) {
  const [hoverId, setHoverId] = useState<string>("");
  const w = 720;
  const h = 420;

  const pins = useMemo(
    () =>
      candidates
        .filter((c) => typeof c.lat === "number" && typeof c.lng === "number")
        .map((c) => ({
          ...c,
          ...project(c.lat as number, c.lng as number, w, h),
        })),
    [candidates],
  );

  const hover = pins.find((p) => p.id === hoverId);

  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-heading font-semibold text-foreground">
            GIG workers across the US
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pins.length} candidates with location · click a pin to open profile
          </p>
        </div>
      </div>
      <div className="relative bg-muted/30 p-3 lg:p-4">
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="w-full h-auto max-h-[420px] text-foreground"
          role="img"
          aria-label="Map of GIG worker locations in the United States"
        >
          <rect width={w} height={h} className="fill-background" />
          {/* Simplified continental US outline */}
          <path
            d="M 90 90 L 160 70 L 250 55 L 340 50 L 430 55 L 520 70 L 580 95 L 620 140 L 640 190 L 630 250 L 600 300 L 540 340 L 470 360 L 400 370 L 330 365 L 260 350 L 200 320 L 150 280 L 110 230 L 85 170 Z"
            className="fill-muted/60 stroke-border"
            strokeWidth="2"
          />
          {/* Great Lakes hint */}
          <ellipse cx="480" cy="140" rx="28" ry="16" className="fill-background/80 stroke-border" strokeWidth="1" />
          <ellipse cx="520" cy="155" rx="18" ry="12" className="fill-background/80 stroke-border" strokeWidth="1" />
          {/* Florida */}
          <path
            d="M 560 300 L 580 330 L 575 360 L 555 345 Z"
            className="fill-muted/60 stroke-border"
            strokeWidth="1.5"
          />
          {/* Texas bulge */}
          <path
            d="M 280 300 L 340 295 L 360 340 L 300 350 Z"
            className="fill-muted/40 stroke-border"
            strokeWidth="1"
          />

          {pins.map((p) => (
            <g key={p.id}>
              <Link to={`/employer/candidate/${p.id}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={hoverId === p.id ? 8 : 5.5}
                  className="fill-primary stroke-background cursor-pointer"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId("")}
                  onClick={() => onSelect?.(p.id)}
                />
              </Link>
            </g>
          ))}
        </svg>

        {hover && (
          <div className="absolute left-4 bottom-4 right-4 sm:right-auto sm:max-w-xs border border-border bg-card p-3 shadow-sm">
            <p className="text-sm font-medium text-foreground">{hover.name}</p>
            <p className="text-xs text-muted-foreground">{hover.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {hover.location}
              {hover.visaStatus ? ` · ${hover.visaStatus}` : ""}
            </p>
            <Link
              to={`/employer/candidate/${hover.id}`}
              className="text-xs text-primary mt-2 inline-block hover:underline"
            >
              View profile & resume
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
