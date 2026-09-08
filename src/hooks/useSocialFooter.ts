import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SocialFooterConfig } from "../config/siteConfig";
import { resolveSocialFooter } from "../utils/socialFooter";

/** Live footer icon config. Kept out of SocialFooter.tsx so Fast Refresh can update the component. */
export function useSocialFooter(): SocialFooterConfig {
  const overrides = useQuery(api.siteConfigData.getOverrides);
  return resolveSocialFooter(overrides?.socialFooter);
}
