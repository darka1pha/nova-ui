---
"@darkalpha/nova-ui": minor
---

Icons now have rounded corners. `createIcon` fillets every corner where two straight path segments meet (1.25px on the 24px grid), so stars, arrows, chevrons, hulls and other angular shapes share the same soft geometry. Custom icons get it too; pass `createIcon(name, elements, { corner: 0 })` to keep sharp corners.
