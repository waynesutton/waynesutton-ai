import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import siteConfig from "../config/siteConfig";
import { usePageAction, type PageActionResult } from "../utils/webmcp/pageActions";

// Props for the newsletter signup component
interface NewsletterSignupProps {
  source: "home" | "blog-page" | "post" | "page"; // Where the signup form appears
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
  const newsletterEnabled = siteConfig.newsletter?.enabled === true;

  // Shared submit path for the button and the WebMCP subscribe_newsletter
  // tool. Same honeypot check, same validation, same mutation.
  const submitEmail = async (value: string): Promise<PageActionResult> => {
    // Honeypot check: if filled, silently reject (bot detected)
    if (honeypot) {
      // Pretend success to not alert the bot
      setStatus("success");
      setMessage("Thanks for subscribing!");
      setEmail("");
      return { ok: true, message: "Thanks for subscribing!" };
    }

    const trimmed = value.trim();
    if (!trimmed) {
      setStatus("error");
      setMessage("Please enter your email.");
      return { ok: false, reason: "Please enter your email." };
    }

    setEmail(trimmed);
    setStatus("loading");

    try {
      // Include post slug in source for tracking
      const sourceValue = postSlug ? `post:${postSlug}` : source;
      const result = await subscribe({ email: trimmed, source: sourceValue });

      if (result.success) {
        setStatus("success");
        setMessage(result.message);
        setEmail("");
        return { ok: true, message: result.message };
      }
      setStatus("error");
      setMessage(result.message);
      return { ok: false, reason: result.message };
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      return { ok: false, reason: "Something went wrong. Please try again." };
    }
  };

  // Advertise subscribe_newsletter to an in-page agent only while this form
  // is on screen and the newsletter is on
  usePageAction(
    "newsletter",
    newsletterEnabled ? ({ email: value }) => submitEmail(value) : null,
  );

  // Check if newsletter is enabled globally. Placement visibility is decided
  // by the parent so a frontmatter newsletter: true override can still render.
  const newsletterConfig = siteConfig.newsletter;
  if (!newsletterEnabled || !newsletterConfig) return null;

  // Get copy for this placement
  const config =
    source === "home"
      ? newsletterConfig.signup.home
      : source === "blog-page"
        ? newsletterConfig.signup.blogPage
        : source === "page"
          ? (newsletterConfig.signup.pages ??
            newsletterConfig.signup.posts)
          : newsletterConfig.signup.posts;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitEmail(email);
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
