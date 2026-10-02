'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/admin/actions';
import { ADMIN_GRACE_MS, ADMIN_SEEN_KEY, ADMIN_TAB_KEY } from '@/lib/admin/session-keys';

/**
 * Sekme bazlı oturum kontrolü: giriş yapılan sekmenin işareti (sessionStorage)
 * yoksa ve tolerans süresi de geçmişse oturum sonlandırılır.
 *
 * Mobilde sekmeler sık atıldığı için (iOS sekme çöpe atar, WhatsApp'tan link
 * yeni sekmede açılır) işaret yoksa oturum hemen düşürülmez: son başarılı
 * girişin üzerinden ADMIN_GRACE_MS geçmemişse işaret yeniden yazılır. Süre
 * dolduğunda davranış eskisi gibi kalır — yeni oturumda tekrar giriş istenir.
 */
export function AdminTabGuard() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(ADMIN_TAB_KEY) === '1') return;

      const seen = Number(localStorage.getItem(ADMIN_SEEN_KEY) ?? '0');
      if (Number.isFinite(seen) && seen > 0 && Date.now() - seen < ADMIN_GRACE_MS) {
        sessionStorage.setItem(ADMIN_TAB_KEY, '1');
        return;
      }
    } catch {
      // Depolama erişilemezse (gizli sekme vb.) geç.
      return;
    }
    void signOut().finally(() => {
      router.replace('/admin/login');
      router.refresh();
    });
  }, [router]);

  return null;
}
