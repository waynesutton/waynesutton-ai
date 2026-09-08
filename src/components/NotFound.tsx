import { useEffect } from "react";
import { Link } from "react-router-dom";
import siteConfig from "../config/siteConfig";

// Cube placement in percentages of the scene. Size is the smaller of a share
// of the panel height (`h`, cqh) and a share of its width (`w`, cqw) so wide
// desktop panels and narrow phone panels both keep every cube inside the
// frame. `tilt` is the resting rotation; `delay` staggers the float loop so
// the cubes do not bob in unison.
const CUBES = [
  { left: "6%", top: "34%", h: 58, w: 30, tilt: -10, delay: "0s" },
  { left: "34%", top: "2%", h: 44, w: 22, tilt: 16, delay: "-2.6s" },
  { left: "56%", top: "42%", h: 38, w: 19, tilt: -20, delay: "-5.1s" },
  { left: "74%", top: "10%", h: 52, w: 24, tilt: 5, delay: "-1.4s" },
] as const;

// Flat shaded isometric cube: top, left, and right faces share one outline.
// Fills come from CSS variables so the shading follows the active theme.
function Cube() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <polygon
        className="not-found-cube-top"
        points="50,10 90,30 50,50 10,30"
      />
      <polygon
        className="not-found-cube-left"
        points="10,30 50,50 50,90 10,70"
      />
      <polygon
        className="not-found-cube-right"
        points="50,50 90,30 90,70 50,90"
      />
    </svg>
  );
}

// Dashed diamond grid. The wrapping div is rotated in 3D by CSS so the plane
// reads as a floor receding to a horizon at the top of the scene.
function Floor() {
  return (
    <div className="not-found-floor" aria-hidden="true">
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="not-found-grid"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path d="M 44 0 L 0 0 0 44" fill="none" strokeDasharray="3 4" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#not-found-grid)" />
      </svg>
    </div>
  );
}

/**
 * Full bleed 404 screen for the catch-all slug route. A framed scene with a
 * perspective grid and drifting cubes sits above an oversized title, a one
 * sentence explanation, and a single way back home.
 */
export default function NotFound() {
  // Match the page and post title effects so the tab reads correctly
  useEffect(() => {
    document.title = `Page not found | ${siteConfig.name}`;
    return () => {
      document.title = siteConfig.name;
    };
  }, []);

  return (
    <section className="not-found" aria-labelledby="not-found-title">
      <div className="not-found-scene" aria-hidden="true">
        <Floor />
        {CUBES.map((cube, index) => (
          <div
            key={index}
            className="not-found-cube"
            style={{
              left: cube.left,
              top: cube.top,
              width: `min(${cube.h}cqh, ${cube.w}cqw)`,
              // Custom properties feed the float keyframes
              ["--nf-tilt" as string]: `${cube.tilt}deg`,
              ["--nf-delay" as string]: cube.delay,
            }}
          >
            <Cube />
          </div>
        ))}
      </div>

      <div className="not-found-body">
        <h1 id="not-found-title" className="not-found-title">
          Page not
          <br />
          found
        </h1>
        <div className="not-found-aside">
          <p className="not-found-text">
            We couldn't find the page you were looking for. It may have moved or
            the link has a typo.
          </p>
          <Link to="/" className="not-found-cta">
            Back to home
          </Link>
        </div>
      </div>
    </section>
  );
}
