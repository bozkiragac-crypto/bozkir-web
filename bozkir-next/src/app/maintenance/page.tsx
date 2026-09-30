/** MAINTENANCE_MODE=1 iken middleware tüm public trafiği buraya yönlendirir. */
export default function MaintenancePage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background p-8 text-center">
      <div className="max-w-lg rounded-xl border border-border bg-surface p-10">
        <p className="text-eyebrow">Bozkır Ağaç Ürünleri</p>
        <h1 className="text-headline mt-5">Kısa bir bakımdayız</h1>
        <p className="mt-5 leading-relaxed text-muted-strong">
          Siteyi sizin için güncelliyoruz. Kısa süre içinde yeniden hizmetinizde olacağız.
        </p>
      </div>
    </main>
  );
}
