'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/admin/actions';

const KEY = 'bozkir_admin_tab';

/**
 * Sekme bazlı oturum kontrolü: giriş yapılan sekmenin işareti (sessionStorage)
 * yoksa oturum sonlandırılır. Sekme kapanınca sessionStorage silindiği için
 * yeni sekmede/tekrar açılışta yeniden giriş gerekir.
 */
export function AdminTabGuard() {
  const router = useRouter();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(KEY) === '1') return;
    } catch {
      // sessionStorage erişilemezse (nadir) geç.
      return;
    }
    void signOut().finally(() => {
      router.replace('/admin/login');
      router.refresh();
    });
  }, [router]);

  return null;
}
