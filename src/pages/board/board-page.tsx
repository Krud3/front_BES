import { useTranslation } from "@/shared/i18n";

export function BoardPage() {
  const { t } = useTranslation("board");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
      <p className="text-muted-foreground">{t("comingSoon")}</p>
    </div>
  );
}
