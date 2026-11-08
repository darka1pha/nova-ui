---
"@darkalpha/nova-ui": minor
---

**Breaking:** two changes to what installs and what the main entry exports.

- **Tiptap is now an optional peer dependency.** `@darkalpha/nova-ui` no longer installs the 16 `@tiptap/*` packages (and ProseMirror) for every app. If you import `@darkalpha/nova-ui/rich-text-editor`, add them yourself (the command is in the package README):

  ```bash
  pnpm add @tiptap/core @tiptap/pm @tiptap/react @tiptap/starter-kit @tiptap/extensions @tiptap/suggestion @tiptap/extension-bubble-menu @tiptap/extension-highlight @tiptap/extension-image @tiptap/extension-list @tiptap/extension-subscript @tiptap/extension-superscript @tiptap/extension-table @tiptap/extension-text-align @tiptap/extension-text-style @tiptap/extension-typography
  ```

- **The Kaveh brand kit moved to `@darkalpha/nova-ui/kaveh`.** The Kaveh logo family, brand elements, page sections, cards, tables and navigation, plus the Yalda/Nowruz seasonal artwork (`SeasonalGreeting`, `HaftSeen`, the motifs and patterns), are no longer exported from `@darkalpha/nova-ui`. Change the import path:

  ```diff
  - import { KavehLogo, SeasonalGreeting } from "@darkalpha/nova-ui";
  + import { KavehLogo, SeasonalGreeting } from "@darkalpha/nova-ui/kaveh";
  ```

  The `kaveh`, `kaveh-yalda` and `kaveh-nowruz` themes are unchanged and still work by name.
