import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export const Checkbox = React.forwardRef<
  React.ComponentRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer group size-5 shrink-0 rounded-xs border border-line bg-raised text-bg shadow-[var(--shadow-border)]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
      "data-[state=checked]:border-fg data-[state=checked]:bg-fg data-[state=checked]:text-bg",
      "data-[state=indeterminate]:border-fg data-[state=indeterminate]:bg-fg data-[state=indeterminate]:text-bg",
      "disabled:cursor-not-allowed disabled:opacity-40",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className="flex items-center justify-center">
      <Minus
        className="hidden size-3.5 group-data-[state=indeterminate]:block"
        strokeWidth={2.5}
      />
      <Check
        className="size-3.5 group-data-[state=indeterminate]:hidden"
        strokeWidth={2.5}
      />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
