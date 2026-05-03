"use client";

import { useState } from "react";
import AddMenuItemModal from "@/components/AddMenuItemModal";

export default function AddMenuItemHomeButton({ firstRestaurantId }: { firstRestaurantId: string }) {
  const [open, setOpen] = useState(false);

  // Pass empty string so modal defaults to "Select a restaurant"
  void firstRestaurantId;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-green-600 px-4 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        aria-label="Add a new menu item"
      >
        + Add Menu Item
      </button>
      {open && (
        <AddMenuItemModal
          defaultRestaurantId=""
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
