"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RESOURCE_CATEGORIES, RESOURCE_TYPES, type DbInstitution } from "../types";
import { Search, RotateCcw, SlidersHorizontal, Sparkles } from "lucide-react";

interface ResourceFiltersProps {
  institutions: DbInstitution[];
}

export function ResourceFilters({ institutions }: ResourceFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentQuery = searchParams.get("query") || "";
  const currentCategory = searchParams.get("category") || "All";
  const currentType = searchParams.get("resourceType") || "all";
  const currentInstitution = searchParams.get("institutionId") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const [queryInput, setQueryInput] = React.useState(currentQuery);

  const applyFilters = React.useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(overrides).forEach(([key, value]) => {
        if (!value || value === "all" || value === "All") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });

      // Reset page to 1 on filter change
      params.delete("page");

      router.push(`/resources?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters({ query: queryInput.trim() || null });
  };

  const handleReset = () => {
    setQueryInput("");
    router.push("/resources");
  };

  const hasActiveFilters = Boolean(
    currentQuery ||
      (currentCategory && currentCategory !== "All") ||
      (currentType && currentType !== "all") ||
      (currentInstitution && currentInstitution !== "all") ||
      (currentSort && currentSort !== "newest")
  );

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/90 backdrop-blur-md">
      {/* Search Bar with glowing focus and submit button */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2.5">
        <div className="flex-1">
          <Input
            id="search-resources"
            type="text"
            placeholder="Search precision apparatus by keyword, technical specification, or lab..."
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            startIcon={<Search className="h-4 w-4 text-slate-400" />}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 focus:ring-cyan-500"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold shadow-sm px-5"
        >
          <Search className="h-4 w-4 mr-1 text-cyan-400" />
          <span>Search</span>
        </Button>
      </form>

      {/* Category Pills (Vibrant Multi-Hue Palette) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        <button
          type="button"
          onClick={() => applyFilters({ category: "All" })}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
            currentCategory === "All"
              ? "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border border-slate-700 shadow-sm"
              : "bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          ✨ All Categories
        </button>
        {RESOURCE_CATEGORIES.map((cat) => {
          const isSelected = currentCategory === cat;
          const getPillStyle = () => {
            switch (cat) {
              case "Fabrication & CNC":
                return isSelected
                  ? "bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-xs shadow-amber-500/30"
                  : "hover:text-amber-600 dark:hover:text-amber-400";
              case "Electronics & Embedded Kits":
                return isSelected
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-xs shadow-violet-500/30"
                  : "hover:text-violet-600 dark:hover:text-violet-400";
              case "Optics & Imaging":
                return isSelected
                  ? "bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-xs shadow-cyan-500/30"
                  : "hover:text-cyan-600 dark:hover:text-cyan-400";
              case "Biochemical & Life Sciences":
                return isSelected
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-500/30"
                  : "hover:text-emerald-600 dark:hover:text-emerald-400";
              case "Computing & Server Hardware":
                return isSelected
                  ? "bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-xs shadow-rose-500/30"
                  : "hover:text-rose-600 dark:hover:text-rose-400";
              default:
                return isSelected
                  ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs shadow-indigo-500/30"
                  : "hover:text-indigo-600 dark:hover:text-indigo-400";
            }
          };

          return (
            <button
              key={cat}
              type="button"
              onClick={() => applyFilters({ category: isSelected ? "All" : cat })}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                isSelected
                  ? getPillStyle()
                  : `bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/80 ${getPillStyle()}`
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Filter Selectors */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        {/* Resource Type */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Asset Class
          </label>
          <select
            value={currentType}
            onChange={(e) => applyFilters({ resourceType: e.target.value })}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            <option value="all">All Asset Classes</option>
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Institution */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Institution
          </label>
          <select
            value={currentInstitution}
            onChange={(e) => applyFilters({ institutionId: e.target.value })}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            <option value="all">All Consortium Nodes</option>
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sorting */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
            Sort Order
          </label>
          <select
            value={currentSort}
            onChange={(e) => applyFilters({ sort: e.target.value })}
            className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs text-slate-900 focus:border-cyan-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
          >
            <option value="newest">Recently Listed</option>
            <option value="title_asc">Alphabetical (A - Z)</option>
            <option value="deposit_asc">Deposit (Low to High)</option>
            <option value="deposit_desc">Deposit (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Chips & Reset */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-600" />
            <span className="font-medium text-slate-700 dark:text-slate-300">Filtered view active</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 font-semibold text-cyan-700 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-300 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear Filters</span>
          </button>
        </div>
      )}
    </div>
  );
}
