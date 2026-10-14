import { describe, it, expect } from 'vitest';
import { csvCell, MAX_EXPORT_ROWS } from '@/lib/csv';

describe('csvCell', () => {
  it('formula injection (başta = + - @) metne sabitlenir', () => {
    expect(csvCell('=1+2')).toBe("'=1+2");
    expect(csvCell('+SUM(A1)')).toBe("'+SUM(A1)");
    expect(csvCell('-2+3')).toBe("'-2+3");
    expect(csvCell('@cmd')).toBe("'@cmd");
  });

  it('tab/CR ile başlayan değerler sabitlenir', () => {
    expect(csvCell('\tx')).toBe("'\tx");
    expect(csvCell('\rx')).toBe("'\rx");
  });

  it('tırnak/virgül/yeni satır kaçışı çalışır', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('a"b')).toBe('"a""b"');
    expect(csvCell('a\nb')).toBe('"a\nb"');
  });

  it('normal değerler dokunulmadan kalır', () => {
    expect(csvCell('merhaba')).toBe('merhaba');
    expect(csvCell(null)).toBe('');
    expect(csvCell(42)).toBe('42');
  });
});

describe('MAX_EXPORT_ROWS', () => {
  it('makul ve pozitif', () => {
    expect(MAX_EXPORT_ROWS).toBeGreaterThan(0);
  });
});
