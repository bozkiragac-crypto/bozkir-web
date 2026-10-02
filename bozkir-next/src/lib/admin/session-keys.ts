/** Admin sekme/oturum işaretleri. `AdminTabGuard` ve `LoginForm` aynı anahtarları kullanır. */
export const ADMIN_TAB_KEY = 'bozkir_admin_tab';

/** Son başarılı giriş zamanı (epoch ms). Sekme işareti kaybolsa da kısa süreli tolerans sağlar. */
export const ADMIN_SEEN_KEY = 'bozkir_admin_seen';

/**
 * Sekme işareti kaybolduğunda oturumun ne kadar süre daha korunacağı.
 *
 * Mobilde sekmeler sık atılır (iOS Safari sekme çöpe atar, Chrome sekmeyi
 * kapatır, WhatsApp'tan link yeni sekmede açılır). Bu yüzden işaret yoksa
 * oturum hemen sonlandırılmaz; süre dolmadan yeniden işaret yazılır.
 */
export const ADMIN_GRACE_MS = 30 * 60 * 1000;