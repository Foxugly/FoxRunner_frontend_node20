import type { Paginated } from './types';

export async function fetchAllPages<T>(
  fetchPage: (limit: number, offset: number) => Promise<Paginated<T>>,
  limit = 100,
): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  let total = 0;

  do {
    const page = await fetchPage(limit, offset);
    items.push(...page.items);
    total = page.total;
    if (page.items.length === 0) break;
    offset += page.items.length;
  } while (offset < total);

  return items;
}
