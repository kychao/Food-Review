"use client";

import { useState, useRef } from "react";
import StarRating from "@/components/StarRating";
import FlavorSlider from "@/components/FlavorSlider";
import Image from "next/image";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  imageUrl: string | null;
  likes: number;
  dislikes: number;
  createdAt: string;
}

interface Props {
  itemId: string;
  onReviewAdded: (review: Review) => void;
}

export default function ReviewForm({ itemId, onReviewAdded }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  // Flavor sliders — start at 50 (balanced), track whether user touched them
  const [savorySweetness, setSavorySweetness] = useState(50);
  const [healthIndulgence, setHealthIndulgence] = useState(50);
  const [lightHeaviness, setLightHeaviness] = useState(50);
  const [slidersTouched, setSlidersTouched] = useState({ ss: false, hi: false, lh: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (rating === 0) {
      setError("Please select a star rating.");
      return;
    }
    if (comment.length > 500) {
      setError("Comment must be 500 characters or fewer.");
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

      const res = await fetch(`/api/items/${itemId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          comment: comment.trim() || undefined,
          imageUrl,
          // Only send slider values if the user actually moved them
          ...(slidersTouched.ss && { savorySweetness }),
          ...(slidersTouched.hi && { healthIndulgence }),
          ...(slidersTouched.lh && { lightHeaviness }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      onReviewAdded(data);
      setRating(0);
      setComment("");
      setSavorySweetness(50);
      setHealthIndulgence(50);
      setLightHeaviness(50);
      setSlidersTouched({ ss: false, hi: false, lh: false });
      removeImage();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      aria-label="Submit a review"
    >
      <h3 className="text-base font-semibold text-gray-900">Leave a Review</h3>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your rating <span aria-hidden="true">*</span>
        </label>
        <StarRating rating={rating} interactive onChange={setRating} size="lg" />
      </div>

      <div className="mt-4">
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">
          Comment <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="review-comment"
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
        <p className="text-sm font-medium text-gray-700">
          Flavor Profile{" "}
          <span className="text-xs font-normal text-gray-400">(optional — move to answer)</span>
        </p>
        <FlavorSlider
          id="slider-savory-sweet"
          leftLabel="Savory"
          rightLabel="Sweet"
          value={savorySweetness}
          onChange={(v) => { setSavorySweetness(v); setSlidersTouched((p) => ({ ...p, ss: true })); }}
        />
        <FlavorSlider
          id="slider-health-indulgence"
          leftLabel="Healthy"
          rightLabel="Indulgent"
          value={healthIndulgence}
          onChange={(v) => { setHealthIndulgence(v); setSlidersTouched((p) => ({ ...p, hi: true })); }}
        />
        <FlavorSlider
          id="slider-light-heavy"
          leftLabel="Light"
          rightLabel="Heavy"
          value={lightHeaviness}
          onChange={(v) => { setLightHeaviness(v); setSlidersTouched((p) => ({ ...p, lh: true })); }}
        />
      </div>

      {/* Image upload */}      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photo <span className="text-gray-400 font-normal">(optional, max 5MB)</span>
        </label>
        {imagePreview ? (
          <div className="relative w-full">
            <Image
              src={imagePreview}
              alt="Preview"
              width={400}
              height={200}
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              ✕ Remove
            </button>
          </div>
        ) : (
          <label
            htmlFor="review-image"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 py-6 text-sm text-gray-500 hover:border-green-400 hover:bg-green-50 transition-colors"
          >
            <span className="text-2xl mb-1" aria-hidden="true">📷</span>
            <span>Click to upload a photo</span>
            <input
              ref={fileInputRef}
              id="review-image"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleImageChange}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700" role="status">
          Review submitted!
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 w-full rounded-full bg-green-600 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
