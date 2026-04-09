"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { JiraIssue } from "@/lib/jira/types";

interface UseJiraAutocompleteResult {
  readonly query: string;
  readonly setQuery: (q: string) => void;
  readonly results: ReadonlyArray<JiraIssue>;
  readonly isLoading: boolean;
  readonly clear: () => void;
}

export function useJiraAutocomplete(
  teamId: string | undefined
): UseJiraAutocompleteResult {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ReadonlyArray<JiraIssue>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!teamId || query.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      // Cancel previous request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/jira/${teamId}/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setResults([]);
          return;
        }
        const data = await res.json();
        if (!controller.signal.aborted) {
          setResults(data.issues ?? []);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [teamId, query]);

  const clear = useCallback(() => {
    setQuery("");
    setResults([]);
    abortRef.current?.abort();
  }, []);

  return { query, setQuery, results, isLoading, clear };
}
