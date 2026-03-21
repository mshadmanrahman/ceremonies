"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

interface LinkButtonProps extends VariantProps<typeof buttonVariants> {
  readonly href: string;
  readonly children: React.ReactNode;
  readonly className?: string;
  readonly onClick?: () => void;
}

export function LinkButton({
  href,
  children,
  variant,
  size,
  className,
  onClick,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={cn(buttonVariants({ variant, size }), className)}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}
