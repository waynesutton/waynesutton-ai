import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import PostList from "../components/PostList";
import { ArrowLeft, User } from "lucide-react";

// Local storage key for author page view mode preference
const AUTHOR_VIEW_MODE_KEY = "author-view-mode";

// Author page component
// Displays all posts written by a specific author
export default function AuthorPage() {
  const { authorSlug } = useParams<{ authorSlug: string }>();
  const navigate = useNavigate();

  // Decode the URL-encoded author slug
  const decodedSlug = authorSlug ? decodeURIComponent(authorSlug) : "";

  // Fetch posts by this author from Convex
  const posts = useQuery(
    api.posts.getPostsByAuthor,
    decodedSlug ? { authorSlug: decodedSlug } : "skip",
  );

  // Fetch all authors for showing count and display name
  const allAuthors = useQuery(api.posts.getAllAuthors);

  // Find the author info for this slug
  const authorInfo = allAuthors?.find(
    (a) => a.slug.toLowerCase() === decodedSlug.toLowerCase(),
  );

  // State for view mode toggle (list or cards)
  const [viewMode, setViewMode] = useState<"list" | "cards">("list");

  // Load saved view mode preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(AUTHOR_VIEW_MODE_KEY);
    if (saved === "list" || saved === "cards") {
      setViewMode(saved);
    }
  }, []);

  // Toggle view mode and save preference
  const toggleViewMode = () => {
    const newMode = viewMode === "list" ? "cards" : "list";
    setViewMode(newMode);
    localStorage.setItem(AUTHOR_VIEW_MODE_KEY, newMode);
  };

  // Update page title
  useEffect(() => {
    if (authorInfo) {
      document.title = `Posts by ${authorInfo.name} | markdown sync framework`;
    } else if (decodedSlug) {
      document.title = `Author | markdown sync framework`;
    }
    return () => {
      document.title = "markdown sync framework";
    };
  }, [authorInfo, decodedSlug]);

  // Handle not found author
  if (posts !== undefined && posts.length === 0) {
    return (
      <div className="author-page">
        <nav className="post-nav">
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>
        </nav>
        <div className="author-not-found">
          <h1>No posts found</h1>
          <p>
            No posts by this author were found.
          </p>
          <Link to="/" className="back-link">
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="author-page">
      {/* Navigation with back button */}
      <nav className="post-nav">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
      </nav>

      {/* Author page header */}
      <header className="author-header">
        <div className="author-header-top">
          <div>
            <div className="author-title-row">
              <User size={24} className="author-icon" />
              <h1 className="author-title">
                {authorInfo?.name || decodedSlug.replace(/-/g, " ")}
              </h1>
            </div>
            <p className="author-description">
              {authorInfo
                ? `${authorInfo.count} post${authorInfo.count !== 1 ? "s" : ""}`
                : "Loading..."}
            </p>
          </div>
          {/* View toggle button */}
          {posts !== undefined && posts.length > 0 && (
            <button
              className="view-toggle-button"
              onClick={toggleViewMode}
              aria-label={`Switch to ${viewMode === "list" ? "card" : "list"} view`}
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

      {/* Author posts section */}
      <section className="author-posts">
        {posts === undefined ? null : (
          <PostList posts={posts} viewMode={viewMode} />
        )}
      </section>
    </div>
  );
}
