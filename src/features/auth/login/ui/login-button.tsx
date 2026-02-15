import { Button } from "@/shared/ui/button";
import { useLogin } from "../model/use-login";

export function LoginButton() {
  const { login, loading } = useLogin();

  return (
    <Button onClick={login} disabled={loading}>
      {loading ? "Cargando..." : "Iniciar sesión con Google"}
    </Button>
  );
}
