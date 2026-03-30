"use client";

import { useState } from "react";
import { Search, Filter } from "lucide-react";

export default function LebensmittelPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Lebensmittel</h1>

      {/* Search */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Suchen..."
            className="w-full rounded-lg border bg-background py-3 pl-10 pr-4"
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Alle", "Gemüse", "Obst", "Fleisch", "Fisch", "Milchprodukte", "Getreide"].map((cat) => (
            <button
              key={cat}
              className="shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-accent"
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 font-semibold">Noch keine Suchergebnisse</h3>
        <p className="text-sm text-muted-foreground">
          Gib einen Suchbegriff ein oder scanne ein Produkt
        </p>
      </div>
    </div>
  );
}
