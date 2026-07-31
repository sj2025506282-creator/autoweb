"use client";

import { useState } from "react";

export function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setStatus("submitting");
    try {
      const response = await fetch("/backend/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json().catch(() => ({ error: "Request failed" })) as {
        error?: string;
      };
      if (!response.ok) {
        setError(data.error || "Could not change password.");
        setStatus("idle");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setStatus("success");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  const disabled = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="p-3 rounded bg-red-50 text-red-700 text-sm">{error}</p>}
      {status === "success" && (
        <p className="p-3 rounded bg-green-50 text-green-700 text-sm">
          Password changed successfully.
        </p>
      )}
      <label className="block text-sm font-medium text-gray-700">
        Current password
        <input
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          className="block w-full mt-1 p-2 border rounded"
          required
          disabled={disabled}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        New password
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          className="block w-full mt-1 p-2 border rounded"
          minLength={12}
          required
          disabled={disabled}
        />
      </label>
      <label className="block text-sm font-medium text-gray-700">
        Confirm new password
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="block w-full mt-1 p-2 border rounded"
          minLength={12}
          required
          disabled={disabled}
        />
      </label>
      <p className="text-xs text-gray-500">
        Use at least 12 characters with uppercase, lowercase, and a number.
      </p>
      <button
        type="submit"
        disabled={disabled}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
      >
        {disabled ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}
