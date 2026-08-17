import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import siteConfig from "../config/siteConfig";

// Props for the newsletter signup component
interface NewsletterSignupProps {
  source: "home" | "blog-page" | "post"; // Where the signup form appears
  postSlug?: string; // For tracking which post they subscribed from
  title?: string; // Override default title
  description?: string; // Override default description
}

// Newsletter signup component
// Displays email input form for newsletter subscriptions
// Integrates with Convex backend for subscriber management
// Includes honeypot field for bot protection
export default function NewsletterSignup({
  source,
  postSlug,
  title,
  description,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Honeypot field for bot detection
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const subscribe = useMutation(api.newsletter.subscribe);

  // Check if newsletter is enabled globally
  if (!siteConfig.newsletter?.enabled) return null;

  // Get config for this placement
  const config =
    source === "home"
      ? siteConfig.newsletter.signup.home
      : source === "blog-page"
        ? siteConfig.newsletter.signup.blogPage
        : siteConfig.newsletter.signup.posts;

  // Check if this specific placement is enabled
  if (!config.enabled) return null;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: if filled, silently reject (bot detected)
    if (honeypot) {
      // Pretend success to not alert the bot
      setStatus("success");
      setMessage("Thanks for subscribing!");
      setEmail("");
      return;
    }

    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email.");
      return;
    }

    setStatus("loading");

    try {
      // Include post slug in source for tracking
      const sourceValue = postSlug ? `post:${postSlug}` : source;
      const result = await subscribe({ email, source: sourceValue });

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setEmail("");
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="newsletter-signup">
      <div className="newsletter-signup__content">
        <h3 className="newsletter-signup__title">{displayTitle}</h3>
        {displayDescription && (
          <p className="newsletter-signup__description">{displayDescription}</p>
        )}

        {status === "success" ? (
          <p className="newsletter-signup__success">{message}</p>
        ) : (
          <form onSubmit={handleSubmit} className="newsletter-signup__form">
            {/* Honeypot field: hidden from humans, visible to bots */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: "-9999px",
                top: "-9999px",
                opacity: 0,
                pointerEvents: "none",
                height: 0,
                overflow: "hidden",
              }}
            >
              <label htmlFor={`newsletter-fax-${source}`}>Fax</label>
              <input
                id={`newsletter-fax-${source}`}
                type="text"
                name="fax"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="newsletter-signup__input"
              disabled={status === "loading"}
              aria-label="Email address"
            />
            <button
              type="submit"
              className="newsletter-signup__button"
              disabled={status === "loading"}
            >
              {status === "loading" ? "..." : "Subscribe"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="newsletter-signup__error">{message}</p>
        )}
      </div>
    </section>
  );
}
