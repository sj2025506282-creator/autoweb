"use client";

import { useState, FormEvent } from "react";

interface ReservationFormData {
  customer_name: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  party_size: number;
  note: string;
}

type FormStatus = "idle" | "submitting" | "success" | "error";

export function ReservationForm({ restaurantId }: { restaurantId: string }) {
  const [formData, setFormData] = useState<ReservationFormData>({
    customer_name: "",
    phone: "",
    email: "",
    date: "",
    time: "",
    party_size: 2,
    note: "",
  });
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "party_size" ? parseInt(value, 10) || 1 : value,
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const reservationTime = formData.date && formData.time
        ? `${formData.date}T${formData.time}:00`
        : "";

      const res = await fetch("/backend/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          customerName: formData.customer_name,
          phone: formData.phone,
          email: formData.email,
          partySize: formData.party_size,
          reservationTime,
          note: formData.note,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" })) as { error?: string };
        throw new Error(data.error || "Failed to submit reservation");
      }

      setStatus("success");
      setFormData({
        customer_name: "",
        phone: "",
        email: "",
        date: "",
        time: "",
        party_size: 2,
        note: "",
      });
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="max-w-md mx-auto p-8 bg-green-50 border border-green-200 rounded-lg text-center">
        <svg className="w-12 h-12 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <h3 className="text-xl font-bold text-green-800 mb-2">Reservation Requested!</h3>
        <p className="text-green-700">We will contact you shortly to confirm your reservation.</p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Make Another Reservation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-5">
      {status === "error" && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="customer_name"
          name="customer_name"
          required
          value={formData.customer_name}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="Your full name"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          placeholder="you@example.com"
        />
      </div>

      {/* Date & Time row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            required
            value={formData.date}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Time <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            id="time"
            name="time"
            required
            value={formData.time}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      {/* Party size */}
      <div>
        <label htmlFor="party_size" className="block text-sm font-medium text-gray-700 mb-1">
          Party Size
        </label>
        <select
          id="party_size"
          name="party_size"
          value={formData.party_size}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "Guest" : "Guests"}
            </option>
          ))}
        </select>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          Special Requests
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          value={formData.note}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none"
          placeholder="Allergies, special occasions, seating preferences..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {status === "submitting" ? "Submitting..." : "Reserve a Table"}
      </button>
    </form>
  );
}
