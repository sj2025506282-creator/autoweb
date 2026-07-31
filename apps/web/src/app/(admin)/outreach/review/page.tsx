"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface DemoRestaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  status: string;
  cover_image: string;
  description: string;
  created_at: string;
}

export default function ReviewPage() {
  const [demos, setDemos] = useState<DemoRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionStates, setActionStates] = useState<Record<string, string>>({});

  const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || "autoweb.app";

  useEffect(() => {
    let cancelled = false;

    async function loadDemos() {
      try {
        const res = await fetch("/backend/outreach");
        if (cancelled) return;
        if (res.ok) {
          const data = (await res.json()) as DemoRestaurant[];
          setDemos(data);
        } else {
          setError("Failed to load demo sites");
        }
      } catch {
        if (!cancelled) setError("Network error. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDemos();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAction(id: string, action: "approve" | "reject") {
    setActionStates((prev) => ({ ...prev, [id]: action }));
    setError("");
    try {
      const res = await fetch(`/backend/outreach/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: action === "approve" ? "active" : "draft",
          sendEmail: action === "approve",
        }),
      });
      if (res.ok) {
        // Remove from list
        setDemos((prev) => prev.filter((d) => d.id !== id));
      } else {
        const data = await res.json().catch(() => ({ error: "Request failed" }));
        setError((data as { error?: string }).error ?? `Failed to ${action} demo site`);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setActionStates((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  if (loading) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-6">Review Demo Sites</h2>
        <p className="text-gray-500">Loading demo sites...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Review Demo Sites</h2>
          <p className="text-sm text-gray-500 mt-1">
            Preview generated demo sites, approve to send outreach emails, or reject.
          </p>
        </div>
        <Link
          href="/outreach"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Generate New Demo
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-4">
          {error}
        </div>
      )}

      {demos.length === 0 ? (
        <div className="bg-white p-12 rounded-lg shadow-md text-center">
          <p className="text-gray-500 text-lg mb-2">No demo sites awaiting review</p>
          <p className="text-gray-400 text-sm mb-4">
            Generate a demo site from the Outreach page to start the review process.
          </p>
          <Link
            href="/outreach"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Go to Outreach
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {demos.map((demo) => {
            const actionState = actionStates[demo.id];
            const isProcessing = !!actionState;

            return (
              <div
                key={demo.id}
                className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold truncate">{demo.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {demo.address || "No address"} &middot;{" "}
                    {demo.phone || "No phone"} &middot;{" "}
                    {demo.email ? (
                      <a
                        href={`mailto:${demo.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {demo.email}
                      </a>
                    ) : (
                      "No email"
                    )}
                  </p>
                  {demo.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {demo.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {new Date(demo.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/restaurants/${demo.id}`}
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 text-sm whitespace-nowrap"
                  >
                    Edit
                  </Link>
                  <a
                    href={`https://${demo.slug}.${mainDomain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50 text-sm whitespace-nowrap"
                  >
                    Preview
                  </a>
                  <button
                    type="button"
                    onClick={() => handleAction(demo.id, "approve")}
                    disabled={isProcessing || !demo.email}
                    title={!demo.email ? "Add an outreach email before sending" : undefined}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {actionState === "approve"
                      ? "Sending…"
                      : demo.email
                        ? "Approve & Send Email"
                        : "Email Required"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(demo.id, "reject")}
                    disabled={isProcessing}
                    className="px-4 py-2 border rounded text-red-600 hover:bg-red-50 disabled:text-red-300 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                  >
                    {actionState === "reject" ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
