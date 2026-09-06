import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Info } from "@phosphor-icons/react";
import type { ComponentPropsWithoutRef, ElementRef, ReactNode } from "react";
import { forwardRef } from "react";
import "../../styles/tooltip.css";

// Tooltip primitives with the same names as shadcn/ui so examples from the
// docs drop in unchanged. Styling lives in tooltip.css and uses site tokens,
// not Tailwind. Wrap a tree once in TooltipProvider (the dashboard shell and
// the /write workspace both do) so hover delays are shared across controls.

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className = "", sideOffset = 6, children, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      collisionPadding={8}
      className={`ui-tooltip ${className}`.trim()}
      {...props}>
      {children}
      <TooltipPrimitive.Arrow className="ui-tooltip-arrow" width={10} height={5} />
    </TooltipPrimitive.Content>
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = "TooltipContent";

// One-liner for the common case: wrap a single control, pass the hint.
// Renders the child unchanged when content is empty so callers can pass
// conditional hints without branching. Optional shortcut renders as a kbd.
export function Tip({
  content,
  shortcut,
  side = "bottom",
  align = "center",
  delay,
  children,
}: {
  content: ReactNode;
  shortcut?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  /** Override the provider delay. Use a longer wait for hints on items people click constantly. */
  delay?: number;
  children: ReactNode;
}) {
  if (content === null || content === undefined || content === "") {
    return <>{children}</>;
  }
  return (
    <Tooltip delayDuration={delay}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align}>
        <span className="ui-tooltip-text">{content}</span>
        {shortcut && <kbd className="ui-tooltip-kbd">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  );
}

// Small help icon for labels and card headings. Focusable so keyboard users
// get the same hint as mouse users; the label text stays the visible copy.
export function InfoTip({
  content,
  label = "More information",
  side = "top",
}: {
  content: ReactNode;
  label?: string;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="ui-info-tip" aria-label={label}>
          <Info size={14} weight="bold" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>
        <span className="ui-tooltip-text">{content}</span>
      </TooltipContent>
    </Tooltip>
  );
}
