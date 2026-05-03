interface Props {
  savorySweetness: number | null;   // averaged 0–100
  healthIndulgence: number | null;
  lightHeaviness: number | null;
  reviewCount: number;
}

function ProfileBar({
  leftLabel,
  rightLabel,
  value,
}: {
  leftLabel: string;
  rightLabel: string;
  value: number;
}) {
  const pct = Math.round(value);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-medium text-gray-500">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      <div className="relative h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-green-400 transition-all"
          style={{ width: `${pct}%` }}
          role="presentation"
        />
        {/* Center tick */}
        <div className="absolute left-1/2 top-0 h-full w-px bg-gray-300" aria-hidden="true" />
      </div>
      <p className="text-center text-xs text-gray-400">
        {pct < 40
          ? `Leans ${leftLabel}`
          : pct > 60
          ? `Leans ${rightLabel}`
          : "Balanced"}
      </p>
    </div>
  );
}

export default function FlavorProfile({
  savorySweetness,
  healthIndulgence,
  lightHeaviness,
  reviewCount,
}: Props) {
  // Only show if at least one slider has data
  if (savorySweetness === null && healthIndulgence === null && lightHeaviness === null) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">
        Flavor Profile
        <span className="ml-2 text-xs font-normal text-gray-400">
          based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </h3>
      <div className="flex flex-col gap-5">
        {savorySweetness !== null && (
          <ProfileBar leftLabel="Savory" rightLabel="Sweet" value={savorySweetness} />
        )}
        {healthIndulgence !== null && (
          <ProfileBar leftLabel="Healthy" rightLabel="Indulgent" value={healthIndulgence} />
        )}
        {lightHeaviness !== null && (
          <ProfileBar leftLabel="Light" rightLabel="Heavy" value={lightHeaviness} />
        )}
      </div>
    </div>
  );
}
