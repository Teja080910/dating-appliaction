import { dedupeConnections } from '../src/utils/connectionList';

describe('dedupeConnections', () => {
  const row = (id: any, status: string, name = '') => ({
    id,
    status,
    sender: { displayName: name },
  });

  it('keeps a single row per id so React keys stay unique', () => {
    const result = dedupeConnections([
      row(17, 'PENDING'),
      row(17, 'PENDING'),
      row(18, 'PENDING'),
    ]);

    expect(result.map((item) => item.id)).toEqual([17, 18]);
  });

  it('prefers the accepted row when duplicates collide', () => {
    const result = dedupeConnections([
      row(17, 'PENDING', 'old'),
      row(17, 'ACCEPTED', 'new'),
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('ACCEPTED');
    expect(result[0].sender.displayName).toBe('new');
  });

  it('does not let a stale declined row override a pending one', () => {
    const result = dedupeConnections([row(17, 'PENDING'), row(17, 'DECLINED')]);
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('PENDING');
  });

  it('keeps rows with missing or placeholder ids', () => {
    const result = dedupeConnections([
      row('', 'PENDING'),
      row('0', 'PENDING'),
      row(undefined, 'PENDING'),
    ]);
    expect(result).toHaveLength(3);
  });
});
