import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/entities/user";
import { auth } from "@/shared/api/firebase";
import { logger } from "@/shared/lib/logger";
import { useLogin } from "./use-login";

// ─── Module mocks ────────────────────────────────────────────────────────────

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock("@/entities/user", () => ({
  useAuthStore: vi.fn(),
}));

vi.mock("@/shared/api/firebase", () => ({
  auth: {},
}));

vi.mock("@/shared/i18n", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/shared/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockProvider = {};

// ─── Tests ───────────────────────────────────────────────────────────────────

// Mock state for useAuthStore selector
const mockAuthState = { loading: false };

describe("useLogin", () => {
  beforeEach(() => {
    vi.mocked(GoogleAuthProvider).mockReturnValue(
      mockProvider as unknown as GoogleAuthProvider,
    );
    // Use mockImplementation so the selector arrow function is actually invoked
    vi.mocked(useAuthStore).mockImplementation((selector) =>
      selector(mockAuthState as never),
    );
    mockAuthState.loading = false;
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("calls signInWithPopup with auth and provider on login()", async () => {
      vi.mocked(signInWithPopup).mockResolvedValue(
        undefined as unknown as Awaited<ReturnType<typeof signInWithPopup>>,
      );

      const { login } = useLogin();
      await login();

      expect(signInWithPopup).toHaveBeenCalledWith(auth, expect.any(Object));
    });

    it("logs error and shows toast on auth failure", async () => {
      const authError = new Error("auth/popup-closed-by-user");
      vi.mocked(signInWithPopup).mockRejectedValue(authError);

      const { login } = useLogin();
      await login();

      expect(logger.error).toHaveBeenCalledWith("useLogin", authError);
      expect(toast.error).toHaveBeenCalled();
    });
  });

  describe("loading", () => {
    it("exposes loading state from auth store", () => {
      mockAuthState.loading = true;

      const { loading } = useLogin();

      expect(loading).toBe(true);
    });
  });
});
