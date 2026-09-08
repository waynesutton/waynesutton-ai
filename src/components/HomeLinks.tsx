import type { HomeLinksConfig } from "../config/siteConfig";
import { homeLinksWillRender } from "../utils/homeLinks";

/**
 * Named links on the homepage. Any label, any URL. Renders nothing when the
 * list is off or every row is empty.
 */
export default function HomeLinks({ config }: { config: HomeLinksConfig }) {
  if (!homeLinksWillRender(config)) return null;
  const heading = config.title.trim();

  return (
    <section className="home-links" aria-label={heading || "Links"}>
      {heading ? <h2 className="home-links-title">{heading}</h2> : null}
      <ul className="home-links-list">
        {config.items.map((item) => {
          const external = /^https?:\/\//i.test(item.url);
          return (
            <li key={`${item.label}-${item.url}`}>
              <a
                href={item.url}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
