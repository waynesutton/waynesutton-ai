import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import siteConfig, { FontFamily } from "../config/siteConfig";

// Default font from siteConfig
const DEFAULT_FONT: FontFamily = siteConfig.fontFamily;

// Font scale steps for the dashboard font size control
export type FontScale = "small" | "default" | "large" | "xlarge";

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (fontFamily: FontFamily) => void;
  toggleFontFamily: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

interface FontProviderProps {
  children: ReactNode;
  defaultFont?: FontFamily; // Allow overriding default font
}

// Font family CSS values
const fontFamilies: Record<FontFamily, string> = {
  serif:
    '"New York", -apple-system-ui-serif, ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
  monospace: '"IBM Plex Mono", "Liberation Mono", ui-monospace, monospace',
};

// Get initial font from localStorage or use default
// If siteConfig default has changed, prefer the new default over localStorage
const getInitialFont = (defaultFont: FontFamily): FontFamily => {
  try {
    const saved = localStorage.getItem("blog-font-family") as FontFamily;
    const savedConfigDefault = localStorage.getItem("blog-font-family-config-default") as FontFamily;
    
    // If siteConfig default has changed, use the new default instead of saved preference
    if (savedConfigDefault && savedConfigDefault !== defaultFont) {
      // SiteConfig default changed - use new default and clear saved preference
      localStorage.removeItem("blog-font-family");
      localStorage.setItem("blog-font-family-config-default", defaultFont);
      return defaultFont;
    }
    
    // Use saved preference if valid
    if (saved && ["serif", "sans", "monospace"].includes(saved)) {
      // Store current siteConfig default for future comparison
      if (!savedConfigDefault) {
        localStorage.setItem("blog-font-family-config-default", defaultFont);
      }
      return saved;
    }
    
    // No saved preference - use siteConfig default
    localStorage.setItem("blog-font-family-config-default", defaultFont);
  } catch {
    // localStorage not available
  }
  return defaultFont;
};

// Update CSS variable for font-family
const updateFontFamily = (fontFamily: FontFamily) => {
  document.documentElement.style.setProperty(
    "--font-family",
    fontFamilies[fontFamily]
  );
};

// Multipliers applied to the root font size (rem-based sizes scale with it)
const fontScaleValues: Record<FontScale, string> = {
  small: "93.75%", // 15px base
  default: "100%", // 16px base
  large: "112.5%", // 18px base
  xlarge: "125%", // 20px base
};

const getInitialFontScale = (): FontScale => {
  try {
    const saved = localStorage.getItem("blog-font-scale") as FontScale;
    if (saved && ["small", "default", "large", "xlarge"].includes(saved)) {
      return saved;
    }
  } catch {
    // localStorage not available
  }
  return "default";
};

// Scale the root font size so all rem-based typography follows
const updateFontScale = (scale: FontScale) => {
  document.documentElement.style.fontSize = fontScaleValues[scale];
};

export function FontProvider({
  children,
  defaultFont = DEFAULT_FONT,
}: FontProviderProps) {
  // Initialize font and set CSS variable immediately (synchronously)
  const initialFont = getInitialFont(defaultFont);
  
  // Set CSS variable immediately before React renders
  updateFontFamily(initialFont);

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(initialFont);
  const [fontScale, setFontScaleState] = useState<FontScale>(() => getInitialFontScale());

  // Apply font to DOM and persist to localStorage
  useEffect(() => {
    updateFontFamily(fontFamily);
    localStorage.setItem("blog-font-family", fontFamily);
  }, [fontFamily]);

  // Apply font scale to DOM and persist to localStorage
  useEffect(() => {
    updateFontScale(fontScale);
    try {
      localStorage.setItem("blog-font-scale", fontScale);
    } catch {
      // localStorage not available
    }
  }, [fontScale]);

  // Set font directly
  const setFontFamily = (newFont: FontFamily) => {
    setFontFamilyState(newFont);
  };

  // Cycle through fonts: serif -> sans -> monospace -> serif
  const toggleFontFamily = () => {
    const fonts: FontFamily[] = ["serif", "sans", "monospace"];
    const currentIndex = fonts.indexOf(fontFamily);
    const nextIndex = (currentIndex + 1) % fonts.length;
    setFontFamilyState(fonts[nextIndex]);
  };

  const setFontScale = (scale: FontScale) => {
    setFontScaleState(scale);
  };

  return (
    <FontContext.Provider
      value={{ fontFamily, setFontFamily, toggleFontFamily, fontScale, setFontScale }}
    >
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error("useFont must be used within a FontProvider");
  }
  return context;
}

