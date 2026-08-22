import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import PostList from "../components/PostList";
import Footer from "../components/Footer";
import SocialFooter from "../components/SocialFooter";
import NewsletterSignup from "../components/NewsletterSignup";
import siteConfig from "../config/siteConfig";
import {
  newsletterPosition,
  shouldShowNewsletter,
} from "../utils/newsletter";
import {
  matchingCategorySection,
  resolveHomeCategories,
} from "../utils/homeCategories";

const TAG_VIEW_MODE_KEY = "tag-view-mode";

// Tag archive. Category sections with Show in nav land here, so this page
// follows Blog chrome: title, count, list/cards, footer. No Back row.
export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = tag ? decodeURIComponent(tag) : "";

  const posts = useQuery(
    api.posts.getPostsByTag,
    decodedTag ? { tag: decodedTag } : "skip",
  );
  const allTags = useQuery(api.posts.getAllTags);
  const footerPage = useQuery(api.pages.getPageBySlug, { slug: "footer" });
  const configOverrides = useQuery(api.siteConfigData.getOverrides);
  const homeCategories = resolveHomeCategories(configOverrides);
  const category = matchingCategorySection(homeCategories, decodedTag);

  const pageTitle = category?.title ?? decodedTag;
  const tagInfo = allTags?.find(
    (entry) => entry.tag.toLowerCase() === decodedTag.toLowerCase(),
  );

  const [viewMode, setViewMode] = useState<"list" | "cards">(
    siteConfig.blogPage.viewMode,
  );

  useEffect(() => {
    if (!siteConfig.blogPage.showViewToggle) return;
    const saved = localStorage.getItem(TAG_VIEW_MODE_KEY);
    if (saved === "list" || saved === "cards") {
      setViewMode(saved);
    }
  }, []);

  const toggleViewMode = () => {
    const newMode = viewMode === "list" ? "cards" : "list";
    setViewMode(newMode);
    localStorage.setItem(TAG_VIEW_MODE_KEY, newMode);
  };

  useEffect(() => {
    if (pageTitle) {
      document.title = `${pageTitle} | ${siteConfig.name}`;
    }
    return () => {
      document.title = siteConfig.name;
    };
  }, [pageTitle]);

  const showFooter =
    siteConfig.footer.enabled && siteConfig.footer.showOnBlogPage;
  const showToggle =
    siteConfig.blogPage.showViewToggle &&
    posts !== undefined &&
    posts.length > 0;

  if (posts !== undefined && posts.length === 0) {
    return (
      <div className="blog-page blog-page-list">
        <header className="blog-header">
          <h1 className="blog-title">{pageTitle || decodedTag}</h1>
          <p className="blog-description">No posts with this tag yet.</p>
        </header>
        <Link to="/" className="back-link">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <div
      className={[
        "blog-page",
        viewMode === "cards" ? "blog-page-cards" : "blog-page-list",
      ].join(" ")}
    >
      <header className="blog-header">
        <div className="blog-header-top">
          <div>
            <h1 className="blog-title">{pageTitle}</h1>
            <p className="blog-description">
              {tagInfo
                ? `${tagInfo.count} ${tagInfo.count === 1 ? "post" : "posts"}`
                : posts === undefined
                  ? "Loading..."
                  : `${posts.length} ${posts.length === 1 ? "post" : "posts"}`}
            </p>
          </div>
          {showToggle && (
            <button
              className="view-toggle-button"
              onClick={toggleViewMode}
              aria-label={`Switch to ${viewMode === "list" ? "card" : "list"} view`}
              data-tooltip={`Switch to ${viewMode === "list" ? "card" : "list"} view`}
            >
              {viewMode === "list" ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              )}
            </button>
          )}
        </div>
      </header>

      <section className="blog-posts">
        {posts === undefined ? null : (
          <PostList
            posts={posts}
            viewMode={viewMode}
            showReadTime={siteConfig.postsDisplay.blogShowReadTime !== false}
            showDate={siteConfig.postsDisplay.blogShowDate !== false}
            showYearHeadings={
              siteConfig.postsDisplay.blogShowYearHeadings !== false
            }
          />
        )}
      </section>

      {shouldShowNewsletter(siteConfig.newsletter?.signup.blogPage) &&
        newsletterPosition(
          siteConfig.newsletter?.signup.blogPage,
          "above-footer",
        ) === "below-posts" && <NewsletterSignup source="blog-page" />}

      {shouldShowNewsletter(siteConfig.newsletter?.signup.blogPage) &&
        newsletterPosition(
          siteConfig.newsletter?.signup.blogPage,
          "above-footer",
        ) === "above-footer" && <NewsletterSignup source="blog-page" />}

      {showFooter && <Footer content={footerPage?.content} />}

      {siteConfig.socialFooter?.enabled &&
        siteConfig.socialFooter.showOnBlogPage && <SocialFooter />}
    </div>
  );
}
