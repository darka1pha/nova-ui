export type PageItem = number | "ellipsis-start" | "ellipsis-end";

/** Computes the visible page list with ellipses. Internal: used by `Pagination`, not part of the public API. */
export function getPageItems(page: number, pageCount: number, siblings = 1): PageItem[] {
  const total = siblings * 2 + 5;
  if (pageCount <= total) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const start = Math.max(2, page - siblings);
  const end = Math.min(pageCount - 1, page + siblings);
  const items: PageItem[] = [1];
  if (start > 2) items.push("ellipsis-start");
  else for (let i = 2; i < start; i++) items.push(i);
  for (let i = start; i <= end; i++) items.push(i);
  if (end < pageCount - 1) items.push("ellipsis-end");
  else for (let i = end + 1; i < pageCount; i++) items.push(i);
  items.push(pageCount);
  return items;
}
