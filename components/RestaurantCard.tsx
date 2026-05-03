import Link from "next/link";

interface Props {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
}

export default function RestaurantCard({ id, name, description, itemCount }: Props) {
  return (
    <Link
      href={`/restaurants/${id}`}
      className="group flex flex-col gap-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500/40"
      aria-label={`View menu for ${name}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-gray-900 group-hover:text-green-700">
          {name}
        </h2>
        <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>
      {description && (
        <p className="text-sm leading-relaxed text-gray-500">{description}</p>
      )}
      <span className="mt-auto text-xs font-medium text-green-600 group-hover:underline">
        View menu →
      </span>
    </Link>
  );
}
