import { useState } from "react";
import { Play } from "lucide-react";

function youtubeId(url?: string) {
  if (!url) return "";
  const m = url.match(
    /(?:embed\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return m?.[1] ?? "";
}

interface ModuleVideoPreviewProps {
  title: string;
  videoUrl?: string;
  fallbackSrc?: string;
  duration?: string;
}

export default function ModuleVideoPreview({
  title,
  videoUrl,
  fallbackSrc,
  duration,
}: ModuleVideoPreviewProps) {
  const id = youtubeId(videoUrl);
  const thumbs = id
    ? [
        `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      ]
    : [];
  const candidates = [...thumbs, fallbackSrc].filter(Boolean) as string[];
  const [index, setIndex] = useState(0);
  const src = candidates[index];

  return (
    <div className="relative aspect-video w-full overflow-hidden bg-muted border border-border">
      {src ? (
        <img
          src={src}
          alt={`${title} video preview`}
          className="h-full w-full object-cover"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        <div className="h-full w-full bg-muted" />
      )}
      <div className="absolute inset-0 bg-foreground/25" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center bg-primary text-primary-foreground">
          <Play className="h-6 w-6 fill-current" />
        </div>
        <p className="text-xs font-medium text-primary-foreground bg-foreground/70 px-2 py-1">
          Video preview
          {duration ? ` · ${duration}` : ""}
        </p>
      </div>
    </div>
  );
}
