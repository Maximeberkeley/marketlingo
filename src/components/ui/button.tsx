import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-body font-medium ring-offset-background transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 no-select active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 rounded-button",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-button",
        outline: "border border-input bg-transparent hover:bg-bg-1 text-text-primary rounded-button",
        secondary: "bg-bg-1 text-text-secondary hover:bg-bg-2 rounded-button border border-border",
        ghost: "hover:bg-bg-1 text-text-secondary rounded-button",
        link: "text-primary underline-offset-4 hover:underline",
        // Premium CTA - gradient accent
        cta: "bg-gradient-to-r from-primary to-[hsl(280,100%,60%)] text-primary-foreground hover:opacity-90 rounded-button shadow-lg",
        // Auth social buttons
        social: "bg-bg-2 text-text-primary hover:bg-bg-1 rounded-button border border-border",
        // Trainer option button
        option: "bg-bg-1 text-text-primary hover:border-primary border border-border rounded-card text-left justify-start px-4",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4 text-h3",
        icon: "h-12 w-12",
        full: "h-14 w-full px-6 py-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
