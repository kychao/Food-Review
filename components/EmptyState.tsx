interface Props {
  message: string;
}

export default function EmptyState({ message }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white py-16 text-center"
      role="status"
      aria-live="polite"
    >
      <span className="text-4xl" aria-hidden="true">🍽️</span>
      <p className="mt-3 text-sm text-gray-500">{message}</p>
    </div>
  );
}
