import { Button } from "@/shared/ui/button";
import { useLogout } from "../model/use-logout";

export function LogoutButton() {
  const { logout } = useLogout();

  return <Button onClick={logout}>Cerrar sesión</Button>;
}
