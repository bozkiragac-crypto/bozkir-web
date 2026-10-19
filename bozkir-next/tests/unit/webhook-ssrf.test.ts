import { describe, expect, it } from 'vitest';
import { isDisallowedHost, isDisallowedIp } from '@/lib/webhooks';

describe('webhook SSRF guard', () => {
  it('özel/ayrılmış ana bilgisayarları reddeder', () => {
    const blocked = [
      'localhost',
      'app.localhost',
      'printer.local',
      '127.0.0.1',
      '0.0.0.0',
      '10.0.0.5',
      '172.16.0.1',
      '172.31.255.255',
      '192.168.1.1',
      '169.254.169.254',
      'metadata.google.internal',
      '2130706433', // ondalık 127.0.0.1
      '::1',
      'fd00::1',
      'fe80::1',
    ];
    for (const h of blocked) expect(isDisallowedHost(h), h).toBe(true);
  });

  it('genel adreslere izin verir', () => {
    for (const h of ['example.com', 'hooks.slack.com', '8.8.8.8', '1.1.1.1']) {
      expect(isDisallowedHost(h), h).toBe(false);
    }
  });

  it('IPv4/IPv6 ayrımını doğru yapar', () => {
    expect(isDisallowedIp('192.168.0.10')).toBe(true);
    expect(isDisallowedIp('8.8.4.4')).toBe(false);
    expect(isDisallowedIp('::ffff:10.0.0.1')).toBe(true);
    expect(isDisallowedIp('2606:4700::1111')).toBe(false);
    expect(isDisallowedIp('not-an-ip')).toBe(false);
  });
});
