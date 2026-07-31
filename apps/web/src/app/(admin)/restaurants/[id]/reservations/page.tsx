"use client";

import { use, useState, useEffect, useCallback } from "react";

interface Reservation {
  id: string;
  restaurant_id: string;
  customer_name: string;
  phone: string;
  email: string;
  party_size: number;
  reservation_time: string;
  note: string;
  created_at: string;
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr.replace(" ", "T"));
  return d.toLocaleString();
}

/** Characters that can trigger formula execution in Excel/Google Sheets. */
const CSV_DANGEROUS_CHARS = /^[=+\-@\t\r]/;

function escapeCSV(value: string): string {
  // Prefix cells starting with dangerous characters to prevent formula injection
  const sanitized = CSV_DANGEROUS_CHARS.test(value) ? `'${value}` : value;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export default function ReservationsAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState("");

  const fetchReservations = useCallback(
    async (date?: string) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(
          `/backend/restaurants/${id}/reservations`,
          window.location.origin
        );
        if (date) url.searchParams.set("date", date);
        const res = await fetch(url.toString());
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ||
              `Failed to fetch reservations (${res.status})`
          );
        }
        const data = await res.json();
        setReservations(data as Reservation[]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => void fetchReservations(), 0);
    return () => window.clearTimeout(timeout);
  }, [fetchReservations]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setDateFilter(date);
    fetchReservations(date);
  };

  const handleClearFilter = () => {
    setDateFilter("");
    fetchReservations();
  };

  const handleExportCSV = () => {
    const headers = [
      "Customer Name",
      "Phone",
      "Email",
      "Party Size",
      "Reservation Time",
      "Notes",
      "Created At",
    ];
    const rows = reservations.map((r) => [
      r.customer_name,
      r.phone,
      r.email,
      String(r.party_size),
      r.reservation_time,
      r.note,
      r.created_at,
    ]);

    const csvContent =
      headers.join(",") +
      "\n" +
      rows.map((row) => row.map((cell) => escapeCSV(cell)).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations${dateFilter ? `-${dateFilter}` : ""}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Reservations</h2>
        <button
          onClick={handleExportCSV}
          disabled={loading || reservations.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Export CSV
        </button>
      </div>

      {/* Date filter */}
      <div className="flex items-center gap-3 mb-6">
        <label
          htmlFor="date-filter"
          className="text-sm font-medium text-gray-700"
        >
          Filter by date:
        </label>
        <input
          id="date-filter"
          type="date"
          value={dateFilter}
          onChange={handleDateChange}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {dateFilter && (
          <button
            onClick={handleClearFilter}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Loading reservations...
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && reservations.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No reservations found
          {dateFilter ? ` for ${dateFilter}` : ""}.
        </div>
      )}

      {/* Table */}
      {!loading && !error && reservations.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Phone
                </th>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Party
                </th>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Reservation Time
                </th>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Notes
                </th>
                <th className="text-left p-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-sm font-medium text-gray-900">
                    {r.customer_name}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {r.phone || "—"}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {r.email || "—"}
                  </td>
                  <td className="p-3 text-sm text-gray-600">{r.party_size}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {formatDateTime(r.reservation_time)}
                  </td>
                  <td className="p-3 text-sm text-gray-600 max-w-[200px] truncate">
                    {r.note || "—"}
                  </td>
                  <td className="p-3 text-sm text-gray-400">
                    {formatDateTime(r.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
