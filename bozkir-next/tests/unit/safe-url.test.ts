import { describe, expect, it } from 'vitest';
import { safeHref } from '@/lib/safe-url';

describe('safeHref', () => {
  it('http/https mutlak URL kabul eder', () => {
    expect(safeHref('https://example.com/a')).toBe('https://example.com/a');
    expect(safeHref('http://example.com')).toBe('http://example.com');
  });

  it('site-içi göreli yol/sorgu/çapa kabul eder', () => {
    expect(safeHref('/urunler')).toBe('/urunler');
    expect(safeHref('?q=1')).toBe('?q=1');
    expect(safeHref('#bolum')).toBe('#bolum');
  });

  it('tehlikeli şemaları reddeder (stored XSS)', () => {
    expect(safeHref('javascript:alert(1)')).toBe('');
    expect(safeHref('JaVaScRiPt:alert(1)')).toBe('');
    expect(safeHref('data:text/html,<script>1</script>')).toBe('');
    expect(safeHref('vbscript:msgbox(1)')).toBe('');
    expect(safeHref('mailto:info@bozkiragac.com')).toBe('');
  });

  it('protokol-göreli ve ters eğik çizgili değerleri reddeder (open redirect)', () => {
    expect(safeHref('//evil.com')).toBe('');
    expect(safeHref('/\\evil.com')).toBe('');
    expect(safeHref('\\evil.com')).toBe('');
  });

  it('boş/geçersiz değerleri reddeder', () => {
    expect(safeHref('')).toBe('');
    expect(safeHref('   ')).toBe('');
    expect(safeHref('not a url')).toBe('');
    expect(safeHref(null)).toBe('');
    expect(safeHref(undefined)).toBe('');
  });
});
