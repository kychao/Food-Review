"use client";

import { useState } from "react";
import AddMenuItemModal from "@/components/AddMenuItemModal";

interface Props {
  restaurantId: string;
}

export default function AddMenuItemButton({ restaurantId }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="shrink-0 rounded-full bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/40"
        aria-label="Add a new menu item"
      >
        + Add Item
      </button>
      {open && (
        <AddMenuItemModal
          defaultRestaurantId={restaurantId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
