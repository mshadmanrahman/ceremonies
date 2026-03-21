"use client";

import { useState } from "react";
import Link from "next/link";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LinkButton } from "@/components/shared/link-button";
import { Button } from "@/components/ui/button";
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
        <SheetContent side="right" className="w-64 bg-card">
          <SheetTitle className="font-display text-lg tracking-ceremony">
            Menu
          </SheetTitle>
          <nav className="mt-6 flex flex-col gap-4">
            <Link
              href="https://github.com/mshadmanrahman/ceremonies"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              GitHub
            </Link>
            <LinkButton
              href="/dashboard"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
            >
              Dashboard
            </LinkButton>
            <Show when="signed-out">
              <SignInButton>
                <Button variant="outline" size="sm">
                  Sign in
                </Button>
              </SignInButton>
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
