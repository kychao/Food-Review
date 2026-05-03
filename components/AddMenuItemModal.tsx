"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import StarRating from "@/components/StarRating";
import FlavorSlider from "@/components/FlavorSlider";

interface Restaurant {
  id: string;
  name: string;
}

interface Props {
  defaultRestaurantId: string;
  onClose: () => void;
}

export default function AddMenuItemModal({ defaultRestaurantId, onClose }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [restaurantId, setRestaurantId] = useState(defaultRestaurantId);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [savorySweetness, setSavorySweetness] = useState(50);
  const [healthIndulgence, setHealthIndulgence] = useState(50);
  const [lightHeaviness, setLightHeaviness] = useState(50);
  const [slidersTouched, setSlidersTouched] = useState({ ss: false, hi: false, lh: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then((data) => setRestaurants(data))
      .catch(() => setError("Failed to load restaurants."));
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Item name is required.");
      return;
    }
    if (comment.length > 500) {
      setError("Review comment must be 500 characters or fewer.");
      return;
    }

    setLoading(true);
    try {
      // Upload image first if provided
      let imageUrl: string | null = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || "Image upload failed.");
          setLoading(false);
          return;
        }
        imageUrl = uploadData.url;
      }

      const res = await fetch(`/api/restaurants/${restaurantId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          ...(rating > 0 && {
            rating,
            comment: comment.trim() || undefined,
            imageUrl,
            ...(slidersTouched.ss && { savorySweetness }),
            ...(slidersTouched.hi && { healthIndulgence }),
            ...(slidersTouched.lh && { lightHeaviness }),
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onClose();
      router.push(`/restaurants/${restaurantId}/items/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = name.trim().length > 0 && restaurantId !== "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl overflow-y-auto max-h-[90vh]">
        <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
          Add a Menu Item
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Already exists? Your review will be added to the existing item.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
          {/* Item name */}
          <div>
            <label htmlFor="item-name" className="block text-sm font-medium text-gray-700">
              Item name <span aria-hidden="true">*</span>
            </label>
            <input
              ref={inputRef}
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Avocado Toast"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
              required
            />
          </div>

          {/* Restaurant */}
          <div>
            <label htmlFor="restaurant-select" className="block text-sm font-medium text-gray-700">
              Restaurant <span aria-hidden="true">*</span>
            </label>
            <select
              id="restaurant-select"
              value={restaurantId}
              onChange={(e) => setRestaurantId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            >
              <option value="" disabled>Choose a restaurant…</option>
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-2">
            <p className="text-sm font-medium text-gray-700">
              Leave a review{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </p>
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Your rating</label>
            <StarRating rating={rating} interactive onChange={setRating} size="lg" />
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="modal-comment" className="block text-sm text-gray-600 mb-1">
              Comment
            </label>
            <textarea
              id="modal-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you think?"
              rows={3}
              maxLength={500}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{comment.length}/500</p>
          </div>

          {/* Flavor sliders */}
          <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4">
            <p className="text-sm text-gray-600">
              Flavor Profile{" "}
              <span className="text-xs font-normal text-gray-400">(optional — move to answer)</span>
            </p>
            <FlavorSlider
              id="modal-slider-ss"
              leftLabel="Savory"
              rightLabel="Sweet"
              value={savorySweetness}
              onChange={(v) => { setSavorySweetness(v); setSlidersTouched((p) => ({ ...p, ss: true })); }}
            />
            <FlavorSlider
              id="modal-slider-hi"
              leftLabel="Healthy"
              rightLabel="Indulgent"
              value={healthIndulgence}
              onChange={(v) => { setHealthIndulgence(v); setSlidersTouched((p) => ({ ...p, hi: true })); }}
            />
            <FlavorSlider
              id="modal-slider-lh"
              leftLabel="Light"
              rightLabel="Heavy"
              value={lightHeaviness}
              onChange={(v) => { setLightHeaviness(v); setSlidersTouched((p) => ({ ...p, lh: true })); }}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Photo <span className="text-gray-400">(optional, max 5MB)</span>
            </label>
            {imagePreview ? (
              <div className="relative w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
                >
                  ✕ Remove
                </button>
              </div>
            ) : (
              <label
                htmlFor="modal-image"
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-5 text-sm text-gray-500 hover:border-green-400 hover:bg-green-50 transition-colors"
              >
                <span className="text-2xl mb-1" aria-hidden="true">📷</span>
                <span>Click to upload a photo</span>
                <input
                  ref={fileInputRef}
                  id="modal-image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="flex-1 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Adding…" : "Add Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
