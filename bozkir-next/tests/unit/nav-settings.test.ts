import { describe, it, expect } from 'vitest';
import { sanitizeNav } from '@/lib/admin/nav';

const fallback = [
  { key: 'products', href: '/urunler', visible: true },
  { key: 'about', href: '/hakkimizda', visible: true },
];

describe('nav ayarları', () => {
  it('sıra ve görünürlüğü korur, href’i fallback’ten sabitler', () => {
    const next = sanitizeNav(
      [
        { key: 'about', href: '/evil', visible: false },
        { key: 'products', href: '/evil', visible: true },
      ],
      fallback,
    );
    expect(next).toEqual([
      { key: 'about', href: '/hakkimizda', visible: false },
      { key: 'products', href: '/urunler', visible: true },
    ]);
  });

  it('bilinmeyen ve tekrarlı anahtarları yok sayar', () => {
    const next = sanitizeNav(
      [
        { key: 'unknown', href: '/x', visible: true },
        { key: 'products', href: '/x', visible: true },
        { key: 'products', href: '/x', visible: false },
      ],
      fallback,
    );
    expect(next).toEqual([{ key: 'products', href: '/urunler', visible: true }]);
  });

  it('boş listede varsayılana döner', () => {
    expect(sanitizeNav([], fallback)).toEqual(fallback);
    expect(sanitizeNav(undefined, fallback)).toEqual(fallback);
  });
});
