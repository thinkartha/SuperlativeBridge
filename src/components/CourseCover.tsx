import { useState } from "react";

interface CourseCoverProps {
  src?: string;
  alt: string;
  className?: string;
}

export default function CourseCover({ src, alt, className }: CourseCoverProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`bg-muted ${className ?? ""}`} aria-hidden />;
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
