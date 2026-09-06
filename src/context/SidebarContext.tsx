import { createContext, useContext, useState, ReactNode } from "react";
import { Heading } from "../utils/extractHeadings";

interface SidebarContextType {
  headings: Heading[];
  setHeadings: (headings: Heading[]) => void;
  activeId: string | undefined;
  setActiveId: (id: string | undefined) => void;
  // Per-post hideNav frontmatter: Post.tsx sets this so Layout switches the
  // top nav from fixed to absolute, letting it scroll away with the page
  hideNav: boolean;
  setHideNav: (hidden: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [hideNav, setHideNav] = useState(false);

  return (
    <SidebarContext.Provider
      value={{ headings, setHeadings, activeId, setActiveId, hideNav, setHideNav }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}

// Optional hook that returns undefined if not within provider (for Layout)
export function useSidebarOptional() {
  return useContext(SidebarContext);
}
