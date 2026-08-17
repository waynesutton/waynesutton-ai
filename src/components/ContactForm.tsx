import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import siteConfig from "../config/siteConfig";

// Props for the ContactForm component
interface ContactFormProps {
  source: string; // "page:slug" or "post:slug"
  title?: string; // Optional title override
  description?: string; // Optional description override
}

// Contact form component
// Displays a form with name, email, and message fields
// Submits to Convex which sends email via AgentMail
// Includes honeypot field for bot protection
export default function ContactForm({
  source,
  title,
  description,
}: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState(""); // Honeypot field for bot detection
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const submitContact = useMutation(api.contact.submitContact);

  // Check if contact form is enabled globally
  if (!siteConfig.contactForm?.enabled) return null;

  // Use provided title/description or fall back to config defaults
  const displayTitle = title || siteConfig.contactForm.title;
  const displayDescription = description || siteConfig.contactForm.description;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: if filled, silently reject (bot detected)
    if (honeypot) {
      // Pretend success to not alert the bot
      setStatus("success");
      setStatusMessage("Thanks for your message! We'll get back to you soon.");
      setName("");
      setEmail("");
      setMessage("");
      return;
    }

    // Basic validation
    if (!name.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setStatus("error");
      setStatusMessage("Please enter your email.");
      return;
    }

    if (!message.trim()) {
      setStatus("error");
      setStatusMessage("Please enter a message.");
      return;
    }

    setStatus("loading");

    try {
      const result = await submitContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        source,
      });

      if (result.success) {
        setStatus("success");
        setStatusMessage(result.message);
        // Clear form on success
        setName("");
        setEmail("");
        setMessage("");
      } else {
        setStatus("error");
        setStatusMessage(result.message);
      }
    } catch {
      setStatus("error");
      setStatusMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <section className="contact-form">
      <div className="contact-form__content">
        <h3 className="contact-form__title">{displayTitle}</h3>
        {displayDescription && (
          <p className="contact-form__description">{displayDescription}</p>
        )}

        {status === "success" ? (
          <div className="contact-form__success">
            <p>{statusMessage}</p>
            <button
              type="button"
              className="contact-form__reset-button"
              onClick={() => setStatus("idle")}
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form__form">
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
              <label htmlFor="contact-website">Website</label>
              <input
                id="contact-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-name" className="contact-form__label">
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="contact-form__input"
                disabled={status === "loading"}
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-email" className="contact-form__label">
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="contact-form__input"
                disabled={status === "loading"}
              />
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-message" className="contact-form__label">
                Message
              </label>
              <textarea
                id="contact-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your message..."
                className="contact-form__textarea"
                rows={5}
                disabled={status === "loading"}
              />
            </div>

            <button
              type="submit"
              className="contact-form__button"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="contact-form__error">{statusMessage}</p>
        )}
      </div>
    </section>
  );
}
