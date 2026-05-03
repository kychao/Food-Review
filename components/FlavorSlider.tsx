"use client";

interface Props {
  id: string;
  leftLabel: string;
  rightLabel: string;
  value: number; // 0–100
  onChange: (value: number) => void;
}

export default function FlavorSlider({ id, leftLabel, rightLabel, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative flex items-center">
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label={`${leftLabel} to ${rightLabel} slider`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={
            value < 40
              ? `More ${leftLabel}`
              : value > 60
              ? `More ${rightLabel}`
              : "Balanced"
          }
          className="w-full h-2 rounded-full appearance-none cursor-pointer
            bg-gradient-to-r from-green-200 to-green-500
            accent-green-600
            focus:outline-none focus:ring-2 focus:ring-green-500/40"
        />
      </div>
      <p className="text-center text-xs text-gray-400">
        {value < 40
          ? `More ${leftLabel}`
          : value > 60
          ? `More ${rightLabel}`
          : "Balanced"}
      </p>
    </div>
  );
}
