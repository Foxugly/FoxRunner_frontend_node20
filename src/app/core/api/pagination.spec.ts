import { fetchAllPages } from './pagination';

describe('fetchAllPages', () => {
  it('loads pages until the reported total is reached', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1, 2], total: 3, limit: 2, offset: 0 })
      .mockResolvedValueOnce({ items: [3], total: 3, limit: 2, offset: 2 });

    await expect(fetchAllPages(fetchPage, 2)).resolves.toEqual([1, 2, 3]);
    expect(fetchPage).toHaveBeenNthCalledWith(1, 2, 0);
    expect(fetchPage).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it('stops when an API page is unexpectedly empty', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: [1], total: 3, limit: 2, offset: 0 })
      .mockResolvedValueOnce({ items: [], total: 3, limit: 2, offset: 1 });

    await expect(fetchAllPages(fetchPage, 2)).resolves.toEqual([1]);
    expect(fetchPage).toHaveBeenCalledTimes(2);
  });
});
