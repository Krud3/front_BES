import { SettingsDropdown } from "@/widgets/settings-dropdown";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border bg-background px-4 md:px-6">
      {/* Left slot — reserved for breadcrumb or page title */}
      <div />

      {/* Right slot — user settings dropdown */}
      <SettingsDropdown />
    </header>
  );
}
