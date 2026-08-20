import { Link } from "react-router-dom";
import type {
  HomeCategoriesConfig,
  HomeCategorySection,
} from "../config/siteConfig";

// Minimal shape this component needs from a post. Matches api.posts.getAllPosts
// rows, so the homepage can group the list it already fetched.
export interface CategoryPost {
  slug: string;
  title: string;
  date: string;
  tags: Array<string>;
}

interface HomeCategoriesProps {
  config: HomeCategoriesConfig;
  posts: Array<CategoryPost>;
}

const DEFAULT_LIMIT = 8;

// "2026-02-15" to "February 2026" without pulling in a date library
function formatMonthYear(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function sectionPosts(
  section: HomeCategorySection,
  posts: Array<CategoryPost>,
): Array<CategoryPost> {
  const tag = section.tag.trim().toLowerCase();
  if (!tag) return [];
  const matches = posts.filter((post) =>
    post.tags.some((postTag) => postTag.trim().toLowerCase() === tag),
  );
  return matches.slice(
    0,
    section.limit && section.limit > 0 ? section.limit : DEFAULT_LIMIT,
  );
}

export default function HomeCategories({ config, posts }: HomeCategoriesProps) {
  if (!config.enabled) return null;

  // Skip empty sections entirely so a tag with no posts leaves no stray heading
  const resolved = config.sections
    .map((section) => ({ section, items: sectionPosts(section, posts) }))
    .filter((entry) => entry.items.length > 0);

  if (resolved.length === 0) return null;

  return (
    <div className="home-categories">
      {resolved.map(({ section, items }) => (
        <section
          key={`${section.title}-${section.tag}`}
          className="home-category"
        >
          <h2 className="home-category-title">{section.title}</h2>
          <ul
            className={`home-category-list ${
              (section.columns ?? 2) === 2 ? "two-col" : "one-col"
            }`}
          >
            {items.map((post) => (
              <li key={post.slug} className="home-category-item">
                <Link to={`/${post.slug}`} className="home-category-link">
                  {post.title}
                </Link>
                {section.showDate && (
                  <span className="home-category-date">
                    {formatMonthYear(post.date)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
