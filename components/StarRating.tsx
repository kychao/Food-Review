"use client";

interface Props {
  rating: number;
  max?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: "sm" | "md" | "lg";
}

const sizeClass = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export default function StarRating({
  rating,
  max = 5,
  interactive = false,
  onChange,
  size = "md",
}: Props) {
  return (
    <div
      className={`flex gap-0.5 ${sizeClass[size]}`}
      role={interactive ? "radiogroup" : "img"}
      aria-label={`Rating: ${rating} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        const value = i + 1;
        const filled = value <= rating;
        return interactive ? (
          <button
            key={value}
            type="button"
            onClick={() => onChange?.(value)}
            aria-label={`${value} star${value !== 1 ? "s" : ""}`}
            aria-pressed={filled}
            className={`transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500/40 ${
              filled ? "text-yellow-400" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ) : (
          <span
            key={value}
            aria-hidden="true"
            className={filled ? "text-yellow-400" : "text-gray-300"}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}
