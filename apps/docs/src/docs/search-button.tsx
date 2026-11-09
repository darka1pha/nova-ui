import { Kbd } from "@darkalpha/nova-ui";
import { Search } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

// Kept apart from search.tsx so the header doesn't pull in the palette.

/** ⌘K / Ctrl+K toggles the search palette. */
export function useSearchShortcut(setOpen: (open: boolean | ((o: boolean) => boolean)) => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);
}

const noopSubscribe = () => () => {};

/** The header button that opens the palette, showing the shortcut. */
export function SearchButton({ onClick }: { onClick: () => void }) {
  const mac = useSyncExternalStore(noopSubscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts="Control+K Meta+K"
      className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface px-2.5 text-sm text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-focus-ring max-sm:w-8 max-sm:justify-center max-sm:px-0"
    >
      <Search aria-hidden className="size-4" />
      <span className="max-sm:sr-only">Search</span>
      {/* A plain span: CommandShortcut would pull cmdk into the first load. */}
      <span className="ms-3 font-mono text-xs max-md:hidden">
        <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd> <Kbd>K</Kbd>
      </span>
    </button>
  );
}
