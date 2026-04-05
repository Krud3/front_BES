import { I18nextProvider } from "react-i18next";
import { i18n } from "@/shared/i18n";
import { Toaster } from "@/shared/ui/sonner";

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
      <Toaster />
    </I18nextProvider>
  );
}
