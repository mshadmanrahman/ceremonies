"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border-2 border-transparent text-sm font-bold whitespace-nowrap transition-all outline-none select-none focus-visible:border-primary/60 focus-visible:ring-2 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "border-border bg-primary text-primary-foreground shadow-hard-sm hover-lift",
        outline:
          "border-border bg-card shadow-hard-sm hover:border-primary hover:text-primary",
        secondary:
          "border-border bg-secondary text-secondary-foreground shadow-hard-sm hover:bg-secondary/80",
        ghost:
          "border-transparent hover:bg-muted hover:text-foreground",
        destructive:
          "border-destructive/40 bg-destructive/10 text-destructive shadow-hard-sm hover:bg-destructive/20 focus-visible:border-destructive/60 focus-visible:ring-destructive/30",
        link: "border-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 gap-1.5 px-3",
        xs: "h-6 gap-1 px-2 text-xs",
        sm: "h-7 gap-1 px-2.5 text-[0.8rem]",
        lg: "h-9 gap-1.5 px-4",
        xl: "h-12 gap-2 px-6 text-base",
        icon: "size-8",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-7",
        "icon-lg": "size-9",
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
      {...props}
    />
  )
}

export { Button, buttonVariants }
