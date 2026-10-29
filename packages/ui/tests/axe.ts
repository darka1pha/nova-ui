import axe from "axe-core";

/**
 * Runs axe-core against a container and returns violations. Color contrast is
 * skipped because jsdom does not compute styles; contrast is verified at the
 * token level (auditContrast) and in the Playwright suite.
 */
export async function axeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { "color-contrast": { enabled: false }, region: { enabled: false } },
  });
  return results.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`);
}
