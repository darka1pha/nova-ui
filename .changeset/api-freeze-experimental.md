---
"@darkalpha/nova-ui": minor
---

Prepare the public API for the 1.0 freeze (breaking):

- `VirtualTable`, `virtualRange`, `FileUploader` and `useFileUploads` (and their types) move to a new `@darkalpha/nova-ui/experimental` entry. APIs there may still change in a minor release; they move to the main entry once settled. Import them from `"@darkalpha/nova-ui/experimental"`.
- `useComposedRefs` and `getPageItems` are no longer exported. They were internal helpers; use `@radix-ui/react-compose-refs` or a local helper, and `Pagination` for page lists.
- `buttonVariants` and `fieldVariants` stay public and stable as functions that return class strings; the classes they return may change in a minor release.
- The token helpers nova-ui re-exports (`createTheme`, `presets`, `contrastRatio`…) are the same functions as `@darkalpha/nova-tokens` exports, and stay stable from both packages.
