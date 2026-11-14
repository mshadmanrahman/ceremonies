"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useJiraAutocomplete } from "@/hooks/use-jira-autocomplete";
import { cn } from "@/lib/utils";

function parseTicketUrl(value: string): { ref: string; url: string } | null {
  if (!value.startsWith("http://") && !value.startsWith("https://"))
    return null;
  try {
    const url = new URL(value);
    const linearMatch = url.pathname.match(/\/issue\/([A-Z]+-\d+)/i);
    if (linearMatch) return { ref: linearMatch[1].toUpperCase(), url: value };
    const jiraMatch = url.pathname.match(/\/browse\/([A-Z]+-\d+)/i);
    if (jiraMatch) return { ref: jiraMatch[1].toUpperCase(), url: value };
    const githubMatch = url.pathname.match(/\/issues\/(\d+)$/);
    if (githubMatch && url.hostname === "github.com")
      return { ref: `#${githubMatch[1]}`, url: value };
    const fallback = value.match(/([A-Z]+-\d+)/);
    if (fallback) return { ref: fallback[1], url: value };
    return null;
  } catch {
    return null;
  }
}

interface TicketInputProps {
  readonly teamId: string | undefined;
  readonly jiraConnected: boolean;
  readonly onLoad: (ref: string, title: string, url?: string) => void;
}

export function TicketInput({
  teamId,
  jiraConnected,
  onLoad,
}: TicketInputProps) {
  const [input, setInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { setQuery, results, isLoading, clear } = useJiraAutocomplete(
    jiraConnected ? teamId : undefined,
  );

  const handleInputChange = useCallback(
    (value: string) => {
      setInput(value);
      setQuery(value);
      setShowDropdown(value.length >= 2 && jiraConnected);
    },
    [setQuery, jiraConnected],
  );

  const handleSelect = useCallback(
    (issue: { key: string; summary: string; url: string }) => {
      setInput(issue.key);
      setShowDropdown(false);
      clear();
      onLoad(issue.key, issue.summary, issue.url);
    },
    [onLoad, clear],
  );

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    const parsed = trimmed ? parseTicketUrl(trimmed) : null;
    if (parsed) {
      setShowDropdown(false);
      clear();
      onLoad(parsed.ref, parsed.ref, parsed.url);
    } else {
      const ref = trimmed || "Quick vote";
      setShowDropdown(false);
      clear();
      onLoad(ref, ref);
    }
  }, [input, onLoad, clear]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="stagger-in rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-6 text-center">
      <p className="mb-4 text-sm font-bold tracking-wide text-primary/80">
        What are we estimating?
      </p>
      <div className="relative mx-auto flex max-w-md gap-2">
        <div className="relative flex-1">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={
              jiraConnected
                ? "Search Jira, paste a URL, or type ref..."
                : "Paste a URL or type INS-1234"
            }
            onKeyDown={(e) => {
              // Skip Enter that confirms an IME (CJK) composition; 229 covers Safari.
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter" && !showDropdown) handleSubmit();
              if (e.key === "Escape") setShowDropdown(false);
            }}
            onFocus={() => {
              if (input.length >= 2 && results.length > 0 && jiraConnected) {
                setShowDropdown(true);
              }
            }}
            className="h-11 border-2 border-border bg-card text-center shadow-hard-sm"
          />

          {/* Jira autocomplete dropdown */}
          {showDropdown && (results.length > 0 || isLoading) && (
            <div
              ref={dropdownRef}
              className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border-2 border-border bg-card shadow-hard"
            >
              {isLoading && results.length === 0 && (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Searching Jira...
                </div>
              )}
              {results.map((issue) => (
                <button
                  key={issue.key}
                  type="button"
                  onClick={() => handleSelect(issue)}
                  className={cn(
                    "flex w-full items-start gap-2 px-3 py-2 text-left text-sm",
                    "hover:bg-primary/10 focus:bg-primary/10 focus:outline-none",
                  )}
                >
                  <span className="shrink-0 font-mono font-bold text-primary">
                    {issue.key}
                  </span>
                  <span className="truncate text-foreground/80">
                    {issue.summary}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} className="h-11">
          {input.trim() ? "Start" : "Quick vote"}
        </Button>
      </div>
    </div>
  );
}
