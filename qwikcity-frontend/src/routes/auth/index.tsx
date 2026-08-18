import { component$, useSignal, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
import { loginUser, loginWithGoogle, registerUser, verifyEmail, resendVerification, forgotPassword, resetPassword } from "~/lib/api/auth";
import { useCurrentUser, markAuthChecked, clearToken, setCurrentUser } from "~/lib/storage";
import { toast } from "~/lib/toast";

/* ------------------------------------------------------------------ */
/*  Google Identity helper                                             */
/* ------------------------------------------------------------------ */

// NOTE: Qwik cannot serialize mutable module-level state that is captured
// inside a useVisibleTask$ (QRL) boundary. All shared Google state must live
// inside the component as signals/store, not as module-level `let`s.

function loadGoogleIdentityScript(): Promise<void> {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { google?: { accounts?: { id: unknown } } }).google
      ?.accounts?.id
  ) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Could not load Google sign-in."));
      return;
    }
    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (existingScript) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(script);
  });
}

function renderGoogleButton(
  ref: HTMLDivElement,
  clientId: string,
  isLogin: boolean,
) {
  const googleWindow = window as unknown as {
    google?: {
      accounts?: {
        id: {
          initialize: (opts: unknown) => void;
          renderButton: (
            parent: HTMLDivElement,
            opts: Record<string, unknown>,
          ) => void;
        };
      };
    };
  };
  if (!googleWindow.google?.accounts?.id) return;

  googleWindow.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response: { credential: string }) => {
      window.dispatchEvent(
        new CustomEvent("moringa:google-credential", {
          detail: response.credential,
        }),
      );
    },
  });

  ref.innerHTML = "";
  const isMobile = window.innerWidth < 640;
  googleWindow.google.accounts.id.renderButton(ref, {
    theme: "outline",
    size: isMobile ? "medium" : "large",
    width: isMobile ? ref.clientWidth || 280 : 300,
    text: isLogin ? "signin_with" : "signup_with",
    shape: "pill",
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default component$(() => {
  const loc = useLocation();
  const nav = useNavigate();
  const userStore = useCurrentUser();

  const modeFromUrl = loc.url.searchParams.get("mode");
  const tokenFromUrl = loc.url.searchParams.get("token");
  const legacyVerifyToken = loc.url.searchParams.get("verifyToken");
  const verifyTokenFromUrl = modeFromUrl === "verify-email" ? tokenFromUrl : legacyVerifyToken;
  const resetTokenFromUrl = modeFromUrl === "reset-password" ? tokenFromUrl : null;

  const isLogin = useSignal(true);
  const isForgotPasswordMode = useSignal(false);
  const name = useSignal("");
  const email = useSignal("");
  const password = useSignal("");
  const resetPasswordValue = useSignal("");
  const isPasswordVisible = useSignal(false);
  const isResetPasswordVisible = useSignal(false);
  const showVerificationTools = useSignal(false);
  const isGoogleLoading = useSignal(false);
  const googleButtonRef = useSignal<HTMLDivElement>();

  const googleClientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID;

  const isAuthenticated = Boolean(userStore.user);

  const fromParam = (() => {
    const raw = loc.url.searchParams.get("from");
    if (!raw) return "/";
    if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
    return "/";
  })();

  const finishAuthenticatedLogin = $(async (data: { user: unknown }, successMessage: string) => {
    showVerificationTools.value = false;
    setCurrentUser(data.user);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("moringa:user-changed"));
      window.dispatchEvent(new Event("moringa:auth-checked"));
    }
    markAuthChecked();

    const user = data.user as { role?: string } | null;
    if (user?.role === "ADMIN") {
      void nav("/admin?cartMessage=" + encodeURIComponent(successMessage));
      return;
    }

    let redirectMessage = successMessage;
    if (fromParam === "/cart" || fromParam === "/wishlist") {
      redirectMessage = "Welcome back! Your saved items have been restored to your account.";
    }

    void nav(fromParam + "?cartMessage=" + encodeURIComponent(redirectMessage));
  });

  /* redirect if already logged in */
  useVisibleTask$(() => {
    if (isAuthenticated && !resetTokenFromUrl && !verifyTokenFromUrl) {
      const user = userStore.user as { role?: string } | null;
      void nav(user?.role === "ADMIN" ? "/admin" : "/");
    }
  });

  /* verify email from token */
  useVisibleTask$(() => {
    if (!verifyTokenFromUrl) return;
    verifyEmail(verifyTokenFromUrl)
      .then((data) => {
        const message = (data as { message?: string })?.message;
        toast.success("Verification successful" + (message ? `: ${message}` : ""));
        showVerificationTools.value = false;
        isForgotPasswordMode.value = false;
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Verification failed");
      });
  });

  /* reset-password token detected */
  useVisibleTask$(() => {
    if (!resetTokenFromUrl) return;
    isLogin.value = true;
    isForgotPasswordMode.value = true;
    toast.info("Password reset: enter a new password to finish resetting your account.");
  });

  /* reset forgot-password mode when token is cleared */
  useVisibleTask$(({ track }) => {
    track(() => isForgotPasswordMode.value);
    if (isForgotPasswordMode.value || resetTokenFromUrl) return;
    isLogin.value = true;
  });

  /* Google OAuth button */
  useVisibleTask$(({ cleanup }) => {
    if (!googleClientId || !googleButtonRef.value || resetTokenFromUrl) return;

    let cancelled = false;

    const onCredential = async (event: Event) => {
      const credential = (event as CustomEvent<string>).detail;
      if (!credential) {
        toast.error("Google sign-in did not return a valid credential.");
        return;
      }
      isGoogleLoading.value = true;
      showVerificationTools.value = false;
      try {
        const data = await loginWithGoogle(credential);
        await finishAuthenticatedLogin(
          data as { user: unknown },
          "Google sign-in successful. You can now continue shopping.",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Google sign-in failed.");
      } finally {
        if (!cancelled) isGoogleLoading.value = false;
      }
    };

    window.addEventListener("moringa:google-credential", onCredential);

    loadGoogleIdentityScript()
      .then(() => {
        if (!cancelled && googleButtonRef.value) {
          renderGoogleButton(googleButtonRef.value, googleClientId, isLogin.value);
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Could not load Google sign-in.");
      });

    cleanup(() => {
      cancelled = true;
      window.removeEventListener("moringa:google-credential", onCredential);
    });
  });

  /* re-render Google button when tab changes */
  useVisibleTask$(({ track }) => {
    track(() => isLogin.value);
    if (!googleButtonRef.value || !googleClientId || resetTokenFromUrl) return;
    const ref = googleButtonRef.value;
    loadGoogleIdentityScript()
      .then(() => {
        if (!resetTokenFromUrl) renderGoogleButton(ref, googleClientId, isLogin.value);
      })
      .catch(() => {});
  });

  const handleSubmit = $(async () => {
    try {
      if (resetTokenFromUrl) {
        const data = await resetPassword(resetTokenFromUrl, resetPasswordValue.value);
        const emailFromReset = (data as { email?: string })?.email;
        const loginData = await loginUser(emailFromReset ?? email.value, resetPasswordValue.value);
        toast.success("Password reset successful. Redirecting...");
        await finishAuthenticatedLogin(
          loginData as { user: unknown },
          "Password reset successful. You are now signed in.",
        );
        return;
      }

      if (isForgotPasswordMode.value) {
        const data = await forgotPassword(email.value);
        toast.success((data as { message?: string })?.message || "Reset link sent to your email.");
        return;
      }

      if (isLogin.value) {
        const data = await loginUser(email.value, password.value);
        await finishAuthenticatedLogin(
          data as { user: unknown },
          "Login successful. You can now add items to your cart.",
        );
        toast.success("Login successful. You can now add items to your cart.");
        return;
      }

      clearToken();
      const data = await registerUser(name.value, email.value, password.value);
      const message = (data as { message?: string })?.message || "Registration successful. Check your email to verify your account.";
      showVerificationTools.value = true;
      isLogin.value = true;
      toast.success(message);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      toast.error(message);
      if (message.toLowerCase().includes("verify your email")) {
        showVerificationTools.value = true;
      }
    }
  });

  const handleResendVerification = $(async () => {
    showVerificationTools.value = false;
    try {
      const data = await resendVerification(email.value);
      toast.success((data as { message?: string })?.message || "Verification email sent.");
      showVerificationTools.value = true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not resend verification email");
    }
  });

  return (
    <div class="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6">
      {/* Background */}
      <div class="absolute inset-0">
        <img src="/images/bg-login.webp" alt="" width={1920} height={1080} class="h-full w-full object-cover" aria-hidden="true" />
        <div class="absolute inset-0 backdrop-blur-sm bg-gradient-to-br from-slate-950/90 via-emerald-950/70 to-black/85" />
      </div>

      {/* Top bar */}
      <div class="absolute left-4 right-4 top-4 flex items-center justify-between sm:left-8 sm:top-6">
        <a href="/" class="font-serif text-xl text-white transition hover:text-emerald-200 sm:text-2xl">
          Moringa Store Online
        </a>
        <a href="/" class="text-sm text-slate-300 hover:text-white">
          Back to store
        </a>
      </div>

      {/* Card */}
      <div class="relative z-10 w-full max-w-md rounded-[2rem] border border-emerald-400/20 bg-slate-950/88 p-5 text-slate-100 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
        {/* Title */}
        <h1 class="text-2xl font-semibold text-white">
          {resetTokenFromUrl ? (
            "Reset password"
          ) : isForgotPasswordMode.value ? (
            "Forgot password"
          ) : isLogin.value ? (
            <>
              Sign in to <span class="text-emerald-300">Moringa Store</span>
            </>
          ) : (
            "Create your account"
          )}
        </h1>

        {!resetTokenFromUrl && !isForgotPasswordMode.value && (
          <p class="mt-2 text-sm text-slate-300">
            {isLogin.value
              ? "Already have an account with us? Sign in to continue."
              : "Register first to save your cart, place orders, and track deliveries."}
          </p>
        )}

        {/* Form */}
        <form preventdefault:submit onSubmit$={handleSubmit} class="mt-6 space-y-4">
          {/* Name */}
          {!isLogin.value && !isForgotPasswordMode.value && !resetTokenFromUrl && (
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-300">Full name</label>
              <input class="input w-full" placeholder="Full name" autoComplete="name" value={name.value} onInput$={(_, el) => (name.value = el.value)} required />
            </div>
          )}

          {/* Email */}
          {!resetTokenFromUrl && (
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-300">Email</label>
              <input type="email" class="input w-full" placeholder="Email" autoComplete="email" spellcheck={false} value={email.value} onInput$={(_, el) => (email.value = el.value)} required />
            </div>
          )}

          {/* Password / Reset password */}
          {resetTokenFromUrl ? (
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-300">New password</label>
              <div class="relative">
                <input type={isResetPasswordVisible.value ? "text" : "password"} class="input w-full pr-10" placeholder="New password" autoComplete="new-password" value={resetPasswordValue.value} onInput$={(_, el) => (resetPasswordValue.value = el.value)} required />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick$={() => (isResetPasswordVisible.value = !isResetPasswordVisible.value)}>
                  {isResetPasswordVisible.value ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><circle cx="12" cy="12" r="3" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>
          ) : !isForgotPasswordMode.value ? (
            <div>
              <label class="mb-1 block text-sm font-medium text-slate-300">Password</label>
              <div class="relative">
                <input type={isPasswordVisible.value ? "text" : "password"} class="input w-full pr-10" placeholder="Password" autoComplete="current-password" value={password.value} onInput$={(_, el) => (password.value = el.value)} required />
                <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick$={() => (isPasswordVisible.value = !isPasswordVisible.value)}>
                  {isPasswordVisible.value ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><circle cx="12" cy="12" r="3" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {/* Submit */}
          <button type="submit" class="btn-admin w-full" disabled={isGoogleLoading.value}>
            {resetTokenFromUrl
              ? "Reset password"
              : isForgotPasswordMode.value
                ? "Send reset link"
                : isLogin.value
                  ? "Sign in"
                  : "Register"}
          </button>
        </form>

        {/* Google divider */}
        {!resetTokenFromUrl && !isForgotPasswordMode.value && (
          <div class="mt-5 space-y-3">
            <div class="flex items-center gap-3 text-sm uppercase tracking-[0.15em] text-[var(--text-muted)]">
              <span class="h-px flex-1 bg-[var(--border-strong)]" />
              <span>Or continue with</span>
              <span class="h-px flex-1 bg-[var(--border-strong)]" />
            </div>

            {googleClientId ? (
              <div ref={googleButtonRef} class="flex min-h-[44px] items-center justify-center" aria-label="Sign in with Google" />
            ) : (
              <button type="button" disabled class="btn-secondary w-full opacity-80">
                Continue with Google
              </button>
            )}

            <p class="text-center text-sm text-[var(--text-secondary)]">
              {isLogin.value
                ? "Use your existing Google account to sign in instantly."
                : "Create your account using your existing Google account."}
            </p>

            {!googleClientId && (
              <p class="text-center text-sm text-[var(--warning-text)]">
                Google sign-in is not configured yet. Add <code>PUBLIC_GOOGLE_CLIENT_ID</code> in the frontend env to enable this button.
              </p>
            )}

            {isGoogleLoading.value && (
              <p class="text-center text-sm text-emerald-500">Finishing Google sign-in...</p>
            )}
          </div>
        )}

        {/* Verification tools */}
        {(showVerificationTools.value || Boolean(verifyTokenFromUrl)) && (
          <div class="mt-6 space-y-3 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--bg-secondary)]/80 p-4">
            <p class="text-sm text-[var(--text-secondary)]">Verify your email before signing in. Use the link sent to your inbox.</p>
            <button type="button" onClick$={handleResendVerification} class="btn-secondary w-full">
              Resend verification email
            </button>
          </div>
        )}

        {/* Forgot password toggle */}
        {isLogin.value && !resetTokenFromUrl && (
          <button type="button" onClick$={() => (isForgotPasswordMode.value = !isForgotPasswordMode.value)} class="mt-4 text-sm text-emerald-300 hover:underline">
            {isForgotPasswordMode.value ? "Back to sign in" : "Forgot password?"}
          </button>
        )}

        {/* Switch login/register */}
        <p class="mt-6 text-center text-sm text-slate-400">
          {isLogin.value ? "New here?" : "Already have an account with us?"}{" "}
          <button type="button" onClick$={() => { isLogin.value = !isLogin.value; isForgotPasswordMode.value = false; }} class="text-emerald-300 hover:underline">
            {isLogin.value ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
});
