# Nova UI local example

A plain Vite + React app that uses Nova UI **without the npm registry**.

```bash
# from the repository root: build, pack and install into this app
node scripts/install-local.mjs examples/vite-app

# then run it
cd examples/vite-app
npm run dev
```

The installer copies the packed libraries into `vendor/nova-ui/` and points
`package.json` at them with `file:` dependencies, so this folder works on its
own. Re-run the installer after changing the library.
