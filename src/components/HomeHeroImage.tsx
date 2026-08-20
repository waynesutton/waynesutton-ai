import type { HomeHeroImageConfig } from "../config/siteConfig";

interface HomeHeroImageProps {
  config?: HomeHeroImageConfig;
  // Which slot is rendering. "both" in config matches either slot.
  slot: "top" | "bottom";
}

// Keeps the scaler inside a range where the banner still reads as a banner
const MIN_WIDTH = 30;
const MAX_WIDTH = 100;

export default function HomeHeroImage({ config, slot }: HomeHeroImageProps) {
  if (!config?.enabled || !config.src) return null;
  if (config.position !== slot && config.position !== "both") return null;

  const width = Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, config.width || MAX_WIDTH),
  );

  const image = (
    <img
      src={config.src}
      alt={config.alt || ""}
      className="home-hero-image"
      loading={slot === "top" ? "eager" : "lazy"}
    />
  );

  const isExternal = config.href?.startsWith("http");

  return (
    <div
      className={`home-hero-image-wrap ${config.rounded === false ? "" : "rounded"}`}
      style={{ width: `${width}%` }}
    >
      {config.href ? (
        <a
          href={config.href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
        >
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
