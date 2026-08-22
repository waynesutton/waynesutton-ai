import type { HomeHeroImageConfig } from "../config/siteConfig";

interface HomeHeroImageProps {
  config?: HomeHeroImageConfig;
  // Which slot is rendering. Banner uses top/bottom. Aside uses aside.
  slot: "top" | "bottom" | "aside";
}

// Keeps the scaler inside a range where the image still reads as a banner
const MIN_WIDTH = 30;
const MAX_WIDTH = 100;

export function heroLayout(
  config?: HomeHeroImageConfig,
): "banner" | "aside" {
  return config?.layout === "aside" ? "aside" : "banner";
}

export function isHeroAside(config?: HomeHeroImageConfig): boolean {
  return Boolean(config?.enabled && config.src && heroLayout(config) === "aside");
}

function mediaKind(src: string): { isSvg: boolean; isGif: boolean } {
  const path = src.split("?")[0].toLowerCase();
  return {
    isSvg: path.endsWith(".svg") || src.includes("image/svg"),
    isGif: path.endsWith(".gif"),
  };
}

export default function HomeHeroImage({ config, slot }: HomeHeroImageProps) {
  if (!config?.enabled || !config.src) return null;

  const layout = heroLayout(config);
  if (layout === "aside") {
    if (slot !== "aside") return null;
  } else if (slot === "aside") {
    return null;
  } else if (config.position !== slot && config.position !== "both") {
    return null;
  }

  const width = Math.min(
    MAX_WIDTH,
    Math.max(MIN_WIDTH, config.width || MAX_WIDTH),
  );
  const { isSvg, isGif } = mediaKind(config.src);
  const className = [
    "home-hero-image",
    layout === "aside" ? "is-aside" : "is-banner",
    isSvg ? "is-svg" : "",
    isGif ? "is-gif" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const image = (
    <img
      src={config.src}
      alt={config.alt || ""}
      className={className}
      loading={slot === "bottom" ? "lazy" : "eager"}
    />
  );

  const isExternal = config.href?.startsWith("http");

  return (
    <div
      className={`home-hero-image-wrap ${layout === "aside" ? "is-aside" : "is-banner"} ${config.rounded === false ? "" : "rounded"}`}
      style={layout === "aside" ? undefined : { width: `${width}%` }}
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
