import { Button } from "@/shared/ui/button";
import { useDeactivate } from "../model/use-deactivate";

export function DeactivateButton() {
  const { deactivate, loading } = useDeactivate();

  const handleClick = () => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate your account? You will be logged out immediately.",
    );
    if (confirmed) deactivate();
  };

  return (
    <Button variant="destructive" onClick={handleClick} disabled={loading}>
      {loading ? "Deactivating…" : "Deactivate account"}
    </Button>
  );
}
