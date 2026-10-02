/**
 * Server action'ları `{ ok: false, error }` sözleşmesine sarar.
 *
 * `requireAdminUser()` / `requireOwner()` düz `throw` ediyordu. Server action
 * sözleşmesi gereği istisna client'a reddedilmiş promise olarak dönüyor;
 * bileşenlerde `await action(...)` satırı atlanıp `setBusy(false)` ve
 * `setError(...)` çalışmadığı için buton kalıcı `disabled` kalıyordu —
 * kullanıcı hiçbir geri bildirim almadan takılı kalıyordu (14+ buton).
 *
 * `actions.ts` içindeki her export server action olduğu için bu modül de
 * 'use server'; böylece istemci bileşenleri sarmalanmış sürümleri çağırır.
 */
'use server';

import * as actions from '@/app/admin/actions';
import * as usersActions from '@/app/admin/users-actions';
import * as settingsActions from '@/app/admin/settings-actions';

type ActionFn<R extends { ok: boolean; error?: string }> = (...args: never[]) => Promise<R>;

/* ---------------- Medya (farklı sözleşmeler) ---------------- */

/** `uploadMedia` `{ ok, error }` değil `{ url, error }` döndürüyor. */
export async function uploadMedia(
  ...args: Parameters<typeof actions.uploadMedia>
): Promise<Awaited<ReturnType<typeof actions.uploadMedia>>> {
  try {
    return await actions.uploadMedia(...args);
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

/** `deleteMedia` sonuç döndürmüyor; hata halinde `{ ok:false, error }` döndürür. */
export async function deleteMedia(
  ...args: Parameters<typeof actions.deleteMedia>
): Promise<{ ok: boolean; error?: string }> {
  try {
    await actions.deleteMedia(...args);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: errorMessage(e) };
  }
}

function errorMessage(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return 'İşlem tamamlanamadı. Lütfen tekrar deneyin.';
}

async function safe<A extends unknown[], R extends { ok: boolean; error?: string }>(
  fn: (...args: A) => Promise<R>,
  args: A,
): Promise<R> {
  try {
    return await fn(...args);
  } catch (e) {
    return { ok: false, error: errorMessage(e) } as R;
  }
}

/* ---------------- Medya ---------------- */

export async function deleteMediaKey(...args: Parameters<typeof actions.deleteMediaKey>) {
  return safe(actions.deleteMediaKey, args);
}

/* ---------------- Ürünler ---------------- */

export async function saveProduct(...args: Parameters<typeof actions.saveProduct>) {
  return safe(actions.saveProduct, args);
}

export async function deleteProduct(...args: Parameters<typeof actions.deleteProduct>) {
  return safe(actions.deleteProduct, args);
}

export async function setProductActive(...args: Parameters<typeof actions.setProductActive>) {
  return safe(actions.setProductActive, args);
}

export async function bulkDeleteProducts(...args: Parameters<typeof actions.bulkDeleteProducts>) {
  return safe(actions.bulkDeleteProducts, args);
}

export async function importProductsCsv(...args: Parameters<typeof actions.importProductsCsv>) {
  return safe(actions.importProductsCsv, args);
}

/* ---------------- Kategoriler / Kampanyalar / Kataloglar / Markalar ---------------- */

export async function saveCategory(...args: Parameters<typeof actions.saveCategory>) {
  return safe(actions.saveCategory, args);
}

export async function deleteCategory(...args: Parameters<typeof actions.deleteCategory>) {
  return safe(actions.deleteCategory, args);
}

export async function saveCampaign(...args: Parameters<typeof actions.saveCampaign>) {
  return safe(actions.saveCampaign, args);
}

export async function deleteCampaign(...args: Parameters<typeof actions.deleteCampaign>) {
  return safe(actions.deleteCampaign, args);
}

export async function saveCatalog(...args: Parameters<typeof actions.saveCatalog>) {
  return safe(actions.saveCatalog, args);
}

export async function deleteCatalog(...args: Parameters<typeof actions.deleteCatalog>) {
  return safe(actions.deleteCatalog, args);
}

export async function saveBrand(...args: Parameters<typeof actions.saveBrand>) {
  return safe(actions.saveBrand, args);
}

export async function deleteBrand(...args: Parameters<typeof actions.deleteBrand>) {
  return safe(actions.deleteBrand, args);
}

/* ---------------- İçerik ---------------- */

export async function saveContentBlock(...args: Parameters<typeof actions.saveContentBlock>) {
  return safe(actions.saveContentBlock, args);
}

export async function saveContentItem(...args: Parameters<typeof actions.saveContentItem>) {
  return safe(actions.saveContentItem, args);
}

export async function deleteContentItem(...args: Parameters<typeof actions.deleteContentItem>) {
  return safe(actions.deleteContentItem, args);
}

export async function saveAboutContent(...args: Parameters<typeof actions.saveAboutContent>) {
  return safe(actions.saveAboutContent, args);
}

export async function saveTranslations(...args: Parameters<typeof actions.saveTranslations>) {
  return safe(actions.saveTranslations, args);
}

export async function deleteQuoteRequest(...args: Parameters<typeof actions.deleteQuoteRequest>) {
  return safe(actions.deleteQuoteRequest, args);
}

/* ---------------- 2FA ---------------- */

export async function startTotpSetup(...args: Parameters<typeof actions.startTotpSetup>) {
  return safe(actions.startTotpSetup, args);
}

export async function enableTotp(...args: Parameters<typeof actions.enableTotp>) {
  return safe(actions.enableTotp, args);
}

export async function disableTotp(...args: Parameters<typeof actions.disableTotp>) {
  return safe(actions.disableTotp, args);
}

/* ---------------- Kullanıcılar / Ayarlar ---------------- */

export async function createUser(...args: Parameters<typeof usersActions.createUser>) {
  return safe(usersActions.createUser, args);
}

export async function updateUser(...args: Parameters<typeof usersActions.updateUser>) {
  return safe(usersActions.updateUser, args);
}

export async function deleteUser(...args: Parameters<typeof usersActions.deleteUser>) {
  return safe(usersActions.deleteUser, args);
}

export async function saveSiteSettings(...args: Parameters<typeof settingsActions.saveSiteSettings>) {
  return safe(settingsActions.saveSiteSettings, args);
}

export type { ActionFn };

/* ---------------- Tipler (bileşenler form alanlarını kullanıyor) ---------------- */

export type {
  AboutInput,
  AboutMilestoneInput,
  AboutStatInput,
  AboutValueInput,
  BrandInput,
  CampaignInput,
  CatalogInput,
  CategoryInput,
  ContentBlockInput,
  ContentItemInput,
  DeleteCategoryMode,
  DeleteCategoryResult,
  ImportResult,
  ProductInput,
  SignInResult,
  TranslationKind,
  TranslationUpdate,
} from '@/app/admin/actions';

export type { UserInput } from '@/app/admin/users-actions';