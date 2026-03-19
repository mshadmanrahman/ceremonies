"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center",
    "rounded-lg border-2 text-sm font-bold whitespace-nowrap select-none",
    "outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    /* Iconoir-style: vertical shadow, press down on hover, flush on active */
    "transition-[transform,box-shadow]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground border-primary-foreground/20",
          "shadow-[0_var(--shadow-offset)_0_0_var(--shadow-color)]",
          "hover:translate-y-[calc(var(--shadow-offset)-2px)] hover:shadow-[0_2px_0_0_var(--shadow-color)]",
          "active:translate-y-[var(--shadow-offset)] active:shadow-none",
        ].join(" "),
        outline: [
          "bg-card text-foreground border-border",
          "shadow-[0_var(--shadow-offset)_0_0_var(--shadow-color)]",
          "hover:border-foreground/40 hover:bg-muted",
          "hover:translate-y-[calc(var(--shadow-offset)-2px)] hover:shadow-[0_2px_0_0_var(--shadow-color)]",
          "active:translate-y-[var(--shadow-offset)] active:shadow-none",
        ].join(" "),
        secondary: [
          "bg-secondary text-secondary-foreground border-border",
          "shadow-[0_3px_0_0_var(--shadow-color)]",
          "hover:bg-secondary/80",
          "hover:translate-y-[1px] hover:shadow-[0_2px_0_0_var(--shadow-color)]",
          "active:translate-y-[3px] active:shadow-none",
        ].join(" "),
        ghost: [
          "border-transparent text-muted-foreground",
          "hover:bg-muted hover:text-foreground",
        ].join(" "),
        destructive: [
          "bg-destructive text-white border-destructive/60",
          "shadow-[0_var(--shadow-offset)_0_0_var(--shadow-color)]",
          "hover:translate-y-[calc(var(--shadow-offset)-2px)] hover:shadow-[0_2px_0_0_var(--shadow-color)]",
          "active:translate-y-[var(--shadow-offset)] active:shadow-none",
        ].join(" "),
        link: "border-transparent text-primary underline-offset-4 hover:underline",
        accent: [
          "bg-accent text-accent-foreground border-accent/60",
          "shadow-[0_var(--shadow-offset)_0_0_var(--shadow-color)]",
          "hover:translate-y-[calc(var(--shadow-offset)-2px)] hover:shadow-[0_2px_0_0_var(--shadow-color)]",
          "active:translate-y-[var(--shadow-offset)] active:shadow-none",
        ].join(" "),
      },
      size: {
        default: "h-10 gap-1.5 px-5",
        xs: "h-7 gap-1 px-2.5 text-xs",
        sm: "h-8 gap-1 px-3.5 text-[0.8rem]",
        lg: "h-11 gap-2 px-6",
        xl: "h-12 gap-2 px-8 text-base",
        icon: "size-10",
        "icon-xs": "size-7",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      style={{ transitionDuration: "var(--duration-micro)", transitionTimingFunction: "var(--ease-ceremony)" }}
      {...props}
    />
  )
}

export { Button, buttonVariants }
