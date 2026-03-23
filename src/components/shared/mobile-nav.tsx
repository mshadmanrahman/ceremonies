"use client";

import { useState } from "react";
import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { OwlIcon } from "@/components/shared/icons";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Menu } from "iconoir-react";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-border bg-card shadow-hard-sm transition-colors hover:border-primary hover:text-primary"
          aria-label="Open menu"
        >
          <Menu width={18} height={18} />
        </SheetTrigger>
        <SheetContent side="right" className="w-72 border-l-2 border-border bg-card p-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <OwlIcon size={24} className="text-primary" />
            <SheetTitle className="font-display text-lg tracking-ceremony">
              ceremonies
            </SheetTitle>
          </div>

          {/* Divider */}
          <div className="my-4 h-0.5 bg-border" />

          {/* Nav links */}
          <nav className="flex flex-col gap-3">
            <Link
              href="https://github.com/mshadmanrahman/ceremonies"
              className="rounded-md px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              GitHub
            </Link>
            <Show when="signed-out">
              <Link
                href="/sign-in"
                className="rounded-md border-2 border-primary bg-primary/10 px-3 py-2.5 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </Show>
            <Show when="signed-in">
              <Link
                href="/dashboard"
                className="rounded-md px-3 py-2.5 text-sm font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Dashboard
              </Link>
              <div className="flex items-center gap-3 rounded-md px-3 py-2.5">
                <UserButton />
                <span className="text-sm font-bold text-muted-foreground">Account</span>
              </div>
            </Show>
          </nav>

          {/* Footer */}
          <div className="mt-auto pt-6">
            <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2.5">
              <span className="text-xs font-bold text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
