"use client";

import { Car } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export function VehicleImage({
  imageUrl,
  alt,
  className,
}: {
  imageUrl?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex items-center justify-center bg-secondary text-muted-foreground ${className ?? ""}`}
      >
        <Car aria-hidden="true" className="size-10" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-secondary ${className ?? ""}`}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 320px, 100vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
