import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Candidate } from "@/types/api";

export type MapRegion = "us" | "ethiopia";

const US_W = 959;
const US_H = 593;

/** Matches public/ethiopia.svg (Natural Earth 10m, equirectangular). */
const ET_W = 800;
const ET_H = 900;
const ET_WEST = 32.6389298892989;
const ET_EAST = 48.329479794797955;
const ET_SOUTH = 3.053040251793527;
const ET_NORTH = 15.230299955186231;

/**
 * Contiguous-US Albers equal-area (matches public/us-states.svg).
 */
function projectAlbersUsa(lat: number, lng: number) {
  if (lat < 24 || lat > 50 || lng < -125 || lng > -66) {
    return null;
  }

  const φ0 = (29.5 * Math.PI) / 180;
  const φ1 = (45.5 * Math.PI) / 180;
  const λ0 = (-96 * Math.PI) / 180;
  const φc = (38 * Math.PI) / 180;
  const φ = (lat * Math.PI) / 180;
  const λ = (lng * Math.PI) / 180;

  const n = (Math.sin(φ0) + Math.sin(φ1)) / 2;
  const C = Math.cos(φ0) ** 2 + 2 * n * Math.sin(φ0);
  const ρ0 = Math.sqrt(C - 2 * n * Math.sin(φc)) / n;
  const θ = n * (λ - λ0);
  const ρ = Math.sqrt(Math.max(0, C - 2 * n * Math.sin(φ))) / n;

  const x = ρ * Math.sin(θ);
  const y = ρ0 - ρ * Math.cos(θ);

  const scale = 1070;
  const px = 480 + scale * x;
  const py = 250 - scale * y;

  if (px < 20 || px > US_W - 20 || py < 10 || py > US_H - 10) {
    return null;
  }
  return { x: px, y: py };
}

function projectEthiopia(lat: number, lng: number) {
  if (lat < ET_SOUTH || lat > ET_NORTH || lng < ET_WEST || lng > ET_EAST) {
    return null;
  }
  const x = ((lng - ET_WEST) / (ET_EAST - ET_WEST)) * ET_W;
  const y = ((ET_NORTH - lat) / (ET_NORTH - ET_SOUTH)) * ET_H;
  if (x < 8 || x > ET_W - 8 || y < 8 || y > ET_H - 8) {
    return null;
  }
  return { x, y };
}

function isInRegion(c: Candidate, region: MapRegion): boolean {
  if (typeof c.lat !== "number" || typeof c.lng !== "number") return false;
  if (region === "us") {
    return c.lat >= 24 && c.lat <= 50 && c.lng >= -125 && c.lng <= -66;
  }
  return (
    c.lat >= ET_SOUTH &&
    c.lat <= ET_NORTH &&
    c.lng >= ET_WEST &&
    c.lng <= ET_EAST
  );
}

type Pin = Candidate & { x: number; y: number };

export default function GigWorkerMap({
  candidates,
  onSelect,
}: {
  candidates: Candidate[];
  onSelect?: (id: string) => void;
}) {
  const [region, setRegion] = useState<MapRegion>("us");
  const [hoverId, setHoverId] = useState("");

  const mapW = region === "us" ? US_W : ET_W;
  const mapH = region === "us" ? US_H : ET_H;

  const usCount = useMemo(
    () => candidates.filter((c) => isInRegion(c, "us")).length,
    [candidates],
  );
  const etCount = useMemo(
    () => candidates.filter((c) => isInRegion(c, "ethiopia")).length,
    [candidates],
  );

  const pins: Pin[] = useMemo(() => {
    const out: Pin[] = [];
    const project = region === "us" ? projectAlbersUsa : projectEthiopia;
    for (const c of candidates) {
      if (!isInRegion(c, region)) continue;
      const pt = project(c.lat!, c.lng!);
      if (!pt) continue;
      out.push({ ...c, ...pt });
    }
    return out;
  }, [candidates, region]);

  const hover = pins.find((p) => p.id === hoverId);

  const byPlace = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of pins) {
      const place = (p.location || "").split(",")[0]?.trim() || "—";
      counts.set(place, (counts.get(place) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [pins]);

  return (
    <div className="border border-border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-heading font-semibold text-foreground">
            GIG workers · {region === "us" ? "United States" : "Ethiopia"}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {pins.length} located candidates · hover a pin for details
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {byPlace.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {byPlace.map(([place, n]) => (
                <span
                  key={place}
                  className="text-[11px] px-2 py-0.5 bg-muted text-muted-foreground border border-border"
                >
                  {place} · {n}
                </span>
              ))}
            </div>
          )}

          <div
            className="inline-flex border border-border bg-muted/40 p-0.5"
            role="group"
            aria-label="Map region"
          >
            <button
              type="button"
              onClick={() => {
                setRegion("us");
                setHoverId("");
              }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                region === "us"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              US
              <span className="ml-1.5 tabular-nums opacity-70">{usCount}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRegion("ethiopia");
                setHoverId("");
              }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                region === "ethiopia"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Ethiopia
              <span className="ml-1.5 tabular-nums opacity-70">{etCount}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative bg-background">
        <div
          className="relative w-full mx-auto max-h-[520px]"
          style={{ aspectRatio: `${mapW} / ${mapH}` }}
        >
          <img
            src={region === "us" ? "/us-states.svg" : "/ethiopia.svg"}
            alt={region === "us" ? "United States map" : "Ethiopia map"}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none dark:invert dark:opacity-90"
            draggable={false}
          />

          <svg
            viewBox={`0 0 ${mapW} ${mapH}`}
            className="absolute inset-0 w-full h-full"
            role="img"
            aria-label="GIG worker locations"
          >
            {pins.map((p) => {
              const active = hoverId === p.id;
              return (
                <g key={p.id}>
                  <Link to={`/employer/candidate/${p.id}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active ? 9 : 6}
                      className="fill-primary/25 stroke-none"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={active ? 5.5 : 4}
                      className="fill-primary stroke-background cursor-pointer"
                      strokeWidth={1.5}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId("")}
                      onClick={() => onSelect?.(p.id)}
                    />
                  </Link>
                </g>
              );
            })}
          </svg>

          {hover && (
            <div className="absolute left-3 bottom-3 right-3 sm:right-auto sm:max-w-xs border border-border bg-card/95 backdrop-blur-sm p-3 shadow-sm z-10">
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

          {pins.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-sm text-muted-foreground bg-card/90 border border-border px-4 py-2">
                No located candidates in this region
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
