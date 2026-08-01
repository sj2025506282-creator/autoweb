"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/backend/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: account.trim(), password }),
      });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error === "Invalid credentials"
          ? "The account or password is incorrect."
          : data.error ?? "Unable to sign in. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f3ee] px-4 py-8 sm:px-6 lg:px-8">
      <div className="absolute -left-24 -top-28 h-80 w-80 rounded-full bg-[#e9b872]/25 blur-3xl" />
      <div className="absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#315b4c]/15 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-[0_28px_90px_rgba(43,38,31,0.14)] lg:grid-cols-[0.9fr_1.1fr]">
          <section className="relative hidden min-h-[620px] overflow-hidden bg-[#173f35] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_25%_20%,#e9b872_0,transparent_35%),radial-gradient(circle_at_85%_85%,#6f9d8c_0,transparent_38%)]" />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9b872] text-xl font-black text-[#173f35] shadow-lg">
                A
              </div>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.3em] text-[#e9b872]">
                Restaurant growth platform
              </p>
              <h1 className="mt-5 max-w-sm text-4xl font-semibold leading-tight tracking-[-0.03em]">
                Turn great local restaurants into beautiful digital experiences.
              </h1>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
                Discover leads, build polished demos, and manage every restaurant from one calm workspace.
              </p>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm leading-6 text-white/75">
                “A focused workspace for moving from discovery to a client-ready restaurant site.”
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#e9b872]">
                AutoWeb Studio
              </p>
            </div>
          </section>

          <section className="flex min-h-[560px] items-center px-6 py-12 sm:px-12 lg:min-h-[620px] lg:px-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-10 lg:hidden">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#173f35] text-lg font-black text-[#e9b872]">
                  A
                </div>
              </div>

              <p className="text-sm font-semibold text-[#9b6a28]">Welcome back</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[#18221f] sm:text-4xl">
                Sign in to AutoWeb
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#66716d]">
                Enter your administrator account to continue.
              </p>

              <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5">
                {error && (
                  <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span aria-hidden="true" className="font-bold">!</span>
                    <span>{error}</span>
                  </div>
                )}

                <label className="block text-sm font-medium text-[#26322e]">
                  Account or email
                  <input
                    name="account"
                    type="text"
                    inputMode="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Enter your account"
                    value={account}
                    onChange={(event) => setAccount(event.target.value)}
                    className="mt-2 block h-12 w-full rounded-xl border border-[#d8ddd9] bg-white px-4 text-base text-[#18221f] outline-none transition placeholder:text-[#a2aaa6] focus:border-[#315b4c] focus:ring-4 focus:ring-[#315b4c]/10 disabled:bg-gray-50 disabled:text-gray-400"
                    required
                    disabled={isSubmitting}
                  />
                </label>

                <label className="block text-sm font-medium text-[#26322e]">
                  Password
                  <span className="relative mt-2 block">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="block h-12 w-full rounded-xl border border-[#d8ddd9] bg-white px-4 pr-16 text-base text-[#18221f] outline-none transition placeholder:text-[#a2aaa6] focus:border-[#315b4c] focus:ring-4 focus:ring-[#315b4c]/10 disabled:bg-gray-50 disabled:text-gray-400"
                      required
                      disabled={isSubmitting}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-[#52605b] hover:text-[#173f35] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#315b4c]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={isSubmitting || !account.trim() || !password}
                  className="flex h-12 w-full items-center justify-center rounded-xl bg-[#173f35] px-4 font-semibold text-white shadow-[0_10px_24px_rgba(23,63,53,0.2)] transition hover:bg-[#215647] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#315b4c]/20 disabled:cursor-not-allowed disabled:bg-[#9caaa5] disabled:shadow-none"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Signing in…
                    </span>
                  ) : "Sign in"}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-[#8a948f]">
                Protected administrator access · AutoWeb
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
