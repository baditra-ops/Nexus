"use client";

import * as React from "react";
import Link from "next/link";
import { useActionState } from "react";
import { createResourceAction, updateResourceAction, type ResourceActionResult } from "../actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RESOURCE_CATEGORIES,
  RESOURCE_TYPES,
  type ResourceWithRelations,
  type DbInstitution,
} from "../types";
import {
  AlertCircle,
  Plus,
  Trash2,
  Clock,
  ShieldCheck,
  Building2,
  DollarSign,
  Upload,
  Cpu,
  Layers,
  Sparkles,
  Microscope,
  Eye,
  CircuitBoard,
  Dna,
  Settings2,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  ShieldAlert,
} from "lucide-react";

interface AvailabilityRow {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

const DAYS = [
  { id: 0, label: "Sunday", short: "Sun" },
  { id: 1, label: "Monday", short: "Mon" },
  { id: 2, label: "Tuesday", short: "Tue" },
  { id: 3, label: "Wednesday", short: "Wed" },
  { id: 4, label: "Thursday", short: "Thu" },
  { id: 5, label: "Friday", short: "Fri" },
  { id: 6, label: "Saturday", short: "Sat" },
];

const CATEGORY_META: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    accentClass: string;
    bgHover: string;
    borderActive: string;
    glowClass: string;
    badgeVariant: "cyan" | "amber" | "fuchsia" | "teal" | "violet" | "emerald" | "neutral";
  }
> = {
  "Analytical & Testing": {
    icon: Microscope,
    accentClass: "text-cyan-400",
    bgHover: "hover:border-cyan-500/50 hover:bg-cyan-950/20",
    borderActive: "border-cyan-500 bg-cyan-950/30 text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)]",
    glowClass: "cyan",
    badgeVariant: "cyan",
  },
  "Fabrication & CNC": {
    icon: Layers,
    accentClass: "text-amber-400",
    bgHover: "hover:border-amber-500/50 hover:bg-amber-950/20",
    borderActive: "border-amber-500 bg-amber-950/30 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.25)]",
    glowClass: "amber",
    badgeVariant: "amber",
  },
  "Computing & Server Hardware": {
    icon: Cpu,
    accentClass: "text-fuchsia-400",
    bgHover: "hover:border-fuchsia-500/50 hover:bg-fuchsia-950/20",
    borderActive: "border-fuchsia-500 bg-fuchsia-950/30 text-fuchsia-300 shadow-[0_0_20px_rgba(217,70,239,0.25)]",
    glowClass: "rose",
    badgeVariant: "fuchsia",
  },
  "Cleanrooms & Specialized Spaces": {
    icon: Sparkles,
    accentClass: "text-sky-400",
    bgHover: "hover:border-sky-500/50 hover:bg-sky-950/20",
    borderActive: "border-sky-500 bg-sky-950/30 text-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.25)]",
    glowClass: "cyan",
    badgeVariant: "cyan",
  },
  "Optics & Imaging": {
    icon: Eye,
    accentClass: "text-teal-400",
    bgHover: "hover:border-teal-500/50 hover:bg-teal-950/20",
    borderActive: "border-teal-500 bg-teal-950/30 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.25)]",
    glowClass: "cyan",
    badgeVariant: "teal",
  },
  "Electronics & Embedded Kits": {
    icon: CircuitBoard,
    accentClass: "text-violet-400",
    bgHover: "hover:border-violet-500/50 hover:bg-violet-950/20",
    borderActive: "border-violet-500 bg-violet-950/30 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.25)]",
    glowClass: "violet",
    badgeVariant: "violet",
  },
  "Biochemical & Life Sciences": {
    icon: Dna,
    accentClass: "text-emerald-400",
    bgHover: "hover:border-emerald-500/50 hover:bg-emerald-950/20",
    borderActive: "border-emerald-500 bg-emerald-950/30 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.25)]",
    glowClass: "emerald",
    badgeVariant: "emerald",
  },
  "Other": {
    icon: Settings2,
    accentClass: "text-slate-400",
    bgHover: "hover:border-slate-500/50 hover:bg-slate-900/40",
    borderActive: "border-slate-400 bg-slate-800 text-slate-200",
    glowClass: "none",
    badgeVariant: "neutral",
  },
};

interface ResourceFormProps {
  initialData?: ResourceWithRelations | null;
  institutions: DbInstitution[];
}

export function ResourceForm({ initialData, institutions }: ResourceFormProps) {
  const isEditing = Boolean(initialData?.id);

  // Form action binding
  const boundAction = isEditing
    ? updateResourceAction.bind(null, initialData!.id)
    : createResourceAction;

  const [state, formAction, isPending] = useActionState<ResourceActionResult | null, FormData>(
    boundAction,
    null
  );

  // Selected Category State
  const [selectedCategory, setSelectedCategory] = React.useState<string>(
    initialData?.category || RESOURCE_CATEGORIES[0]
  );

  // Selected Resource Type State
  const [selectedResourceType, setSelectedResourceType] = React.useState<string>(
    initialData?.resource_type || "equipment"
  );

  // Image preview state
  const [imageUrlPreview, setImageUrlPreview] = React.useState<string>(
    Array.isArray(initialData?.images) && initialData.images.length > 0
      ? (initialData.images[0] as string)
      : ""
  );

  // Availability schedule state
  const [availability, setAvailability] = React.useState<AvailabilityRow[]>(() => {
    if (initialData?.availability && initialData.availability.length > 0) {
      return initialData.availability.map((a) => ({
        day_of_week: a.day_of_week,
        start_time: a.start_time.substring(0, 5),
        end_time: a.end_time.substring(0, 5),
      }));
    }
    // Default: Mon-Fri 09:00 - 17:00
    return [
      { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 2, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 4, start_time: "09:00", end_time: "17:00" },
      { day_of_week: 5, start_time: "09:00", end_time: "17:00" },
    ];
  });

  const addAvailabilityRow = () => {
    setAvailability((prev) => [
      ...prev,
      { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
    ]);
  };

  const removeAvailabilityRow = (index: number) => {
    setAvailability((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAvailabilityRow = (
    index: number,
    field: keyof AvailabilityRow,
    value: string | number
  ) => {
    setAvailability((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const applyPreset = (type: "weekday" | "allweek" | "clear") => {
    if (type === "clear") {
      setAvailability([]);
    } else if (type === "weekday") {
      setAvailability([
        { day_of_week: 1, start_time: "09:00", end_time: "17:00" },
        { day_of_week: 2, start_time: "09:00", end_time: "17:00" },
        { day_of_week: 3, start_time: "09:00", end_time: "17:00" },
        { day_of_week: 4, start_time: "09:00", end_time: "17:00" },
        { day_of_week: 5, start_time: "09:00", end_time: "17:00" },
      ]);
    } else if (type === "allweek") {
      setAvailability([
        { day_of_week: 0, start_time: "08:00", end_time: "20:00" },
        { day_of_week: 1, start_time: "08:00", end_time: "20:00" },
        { day_of_week: 2, start_time: "08:00", end_time: "20:00" },
        { day_of_week: 3, start_time: "08:00", end_time: "20:00" },
        { day_of_week: 4, start_time: "08:00", end_time: "20:00" },
        { day_of_week: 5, start_time: "08:00", end_time: "20:00" },
        { day_of_week: 6, start_time: "08:00", end_time: "20:00" },
      ]);
    }
  };

  const activeCategoryMeta = CATEGORY_META[selectedCategory] || CATEGORY_META["Other"];

  return (
    <form action={formAction} className="space-y-8">
      <input
        type="hidden"
        name="availability_json"
        value={JSON.stringify(availability)}
      />
      <input type="hidden" name="category" value={selectedCategory} />
      <input type="hidden" name="resource_type" value={selectedResourceType} />

      {state?.error && (
        <div
          className="flex items-start gap-3 rounded-2xl border border-rose-500/40 bg-rose-950/40 p-4 text-xs text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.15)] backdrop-blur-md"
          role="alert"
        >
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Registration Submission Error</p>
            <p className="mt-0.5">{state.error}</p>
          </div>
        </div>
      )}

      {/* SECTION 1: CORE APPARATUS IDENTITY & DISCIPLINE SELECTOR */}
      <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-cyan-500/10 via-violet-500/5 to-transparent blur-2xl pointer-events-none" />
        
        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-xs font-black text-white shadow-md shadow-cyan-500/20">
                01
              </span>
              <div>
                <CardTitle className="text-base font-extrabold text-white">
                  Apparatus Identity & Scientific Discipline
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Select the core domain category and specify instrument nomenclature.
                </CardDescription>
              </div>
            </div>
            <Badge variant={activeCategoryMeta.badgeVariant} dot>
              {selectedCategory}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Interactive Multi-hue Category Selector Grid */}
          <div className="space-y-2.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Scientific Discipline / Domain *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {RESOURCE_CATEGORIES.map((cat) => {
                const meta = CATEGORY_META[cat] || CATEGORY_META["Other"];
                const Icon = meta.icon;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200 ${
                      isSelected
                        ? meta.borderActive
                        : `border-white/10 bg-slate-950/40 text-slate-300 ${meta.bgHover}`
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <Icon className={`h-4 w-4 ${isSelected ? meta.accentClass : "text-slate-400"}`} />
                      {isSelected && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] text-white">
                          <Check className="h-2.5 w-2.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold leading-tight line-clamp-1">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <Input
            id="title"
            name="title"
            label="Instrument / Resource Title *"
            placeholder="e.g. JEOL JSM-IT200 Scanning Electron Microscope"
            defaultValue={initialData?.title}
            required
          />

          {/* Resource Type Segmented Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Facility Archetype *
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {RESOURCE_TYPES.map((t) => {
                const isSelected = selectedResourceType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedResourceType(t.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "border-cyan-500/80 bg-cyan-950/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                        : "border-white/10 bg-slate-950/30 text-slate-400 hover:border-white/20 hover:text-slate-200"
                    }`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isSelected ? "bg-cyan-400 animate-pulse" : "bg-slate-600"
                      }`}
                    />
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label
              htmlFor="description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Technical Specifications & Measurement Tolerances
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              placeholder="Detail precision limits, maximum resolution, supported sample matrices, cooling requirements, and provided consumables..."
              defaultValue={initialData?.description || ""}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all backdrop-blur-sm"
            />
          </div>

          {/* Institution & Physical Location */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="institution_id"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Custodian Institution
              </label>
              <select
                id="institution_id"
                name="institution_id"
                defaultValue={initialData?.institution_id || ""}
                className="flex h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm"
              >
                <option value="" className="bg-slate-900 text-slate-400">
                  Consortium Shared (No specific institution)
                </option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id} className="bg-slate-900 text-white">
                    {inst.name}
                  </option>
                ))}
              </select>
            </div>

            <Input
              id="location"
              name="location"
              label="Laboratory Bay / Room Coordinate"
              placeholder="Building 4, Sub-level 1, Nanofab Cleanroom Bay B"
              defaultValue={initialData?.location || ""}
              startIcon={<Building2 className="h-4 w-4 text-cyan-400" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: OPERATING SCHEDULE & AVAILABILITY BUILDER */}
      <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-violet-500/10 via-amber-500/5 to-transparent blur-2xl pointer-events-none" />

        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-xs font-black text-white shadow-md shadow-violet-500/20">
                02
              </span>
              <div>
                <CardTitle className="text-base font-extrabold text-white">
                  Recurring Operating Windows & Access Schedule
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  Configure designated operating shifts for automated reservation clearance.
                </CardDescription>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 hidden sm:inline">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset("weekday")}
                className="rounded-lg border border-white/10 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                Mon–Fri (9–5)
              </button>
              <button
                type="button"
                onClick={() => applyPreset("allweek")}
                className="rounded-lg border border-white/10 bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
              >
                7 Days (8–8)
              </button>
              <Button
                type="button"
                variant="violet"
                size="sm"
                onClick={addAvailabilityRow}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Window</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-6">
          {availability.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 p-8 text-center bg-slate-950/20">
              <Clock className="h-8 w-8 text-slate-500 mb-2" />
              <p className="text-xs font-semibold text-slate-300">No Recurring Windows Configured</p>
              <p className="text-[11px] text-slate-500 max-w-sm mt-1">
                Reservations will default to ad-hoc custodian approval. Click &ldquo;Add Window&rdquo; or a preset to specify standard availability.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => applyPreset("weekday")}
              >
                Apply Standard Mon–Fri Preset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {availability.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 p-3 hover:border-violet-500/30 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-950/80 border border-violet-500/30 text-[11px] font-bold text-violet-300">
                      {DAYS.find((d) => d.id === row.day_of_week)?.short || "Day"}
                    </span>
                    <select
                      value={row.day_of_week}
                      onChange={(e) =>
                        updateAvailabilityRow(idx, "day_of_week", parseInt(e.target.value))
                      }
                      className="h-8 rounded-lg border border-white/10 bg-slate-900 px-2 text-xs font-medium text-slate-200 focus:border-violet-500 focus:outline-none"
                    >
                      {DAYS.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs">
                    <input
                      type="time"
                      value={row.start_time}
                      onChange={(e) =>
                        updateAvailabilityRow(idx, "start_time", e.target.value)
                      }
                      className="h-8 w-20 rounded-lg border border-white/10 bg-slate-900 px-1.5 text-center text-xs font-mono text-cyan-300 focus:border-cyan-400 focus:outline-none"
                      required
                    />
                    <span className="text-slate-500">→</span>
                    <input
                      type="time"
                      value={row.end_time}
                      onChange={(e) =>
                        updateAvailabilityRow(idx, "end_time", e.target.value)
                      }
                      className="h-8 w-20 rounded-lg border border-white/10 bg-slate-900 px-1.5 text-center text-xs font-mono text-cyan-300 focus:border-cyan-400 focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeAvailabilityRow(idx)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-rose-950/60 hover:text-rose-400 transition-colors"
                    aria-label="Remove window"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 3: COMPLIANCE, PREREQUISITE CLEARANCE & REFUNDABLE DEPOSIT */}
      <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-amber-500/10 via-rose-500/5 to-transparent blur-2xl pointer-events-none" />

        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-black text-white shadow-md shadow-amber-500/20">
              03
            </span>
            <div>
              <CardTitle className="text-base font-extrabold text-white">
                Compliance, Safety Credentials & Security Escrow
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Establish borrower prerequisites, lab safety certifications, and required escrow deposits.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="space-y-1.5">
            <label
              htmlFor="eligibility_requirements"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Researcher Eligibility & Certifications
            </label>
            <textarea
              id="eligibility_requirements"
              name="eligibility_requirements"
              rows={3}
              placeholder="e.g. Valid Cleanroom Safety Protocol Tier II, Radiation Safety Clearance, active institutional PI authorization..."
              defaultValue={initialData?.eligibility_requirements || ""}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 backdrop-blur-sm transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="usage_rules"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
            >
              Operating Protocols & Incident Reporting Rules
            </label>
            <textarea
              id="usage_rules"
              name="usage_rules"
              rows={3}
              placeholder="e.g. Nitrile gloves required during sample loading. Clean beam optics after every run. Log calibration run numbers in physical ledger..."
              defaultValue={initialData?.usage_rules || ""}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-3.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 backdrop-blur-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="deposit_amount"
              name="deposit_amount"
              type="number"
              min="0"
              step="1"
              label="Refundable Escrow Security Deposit ($)"
              placeholder="0"
              defaultValue={initialData?.deposit_amount || 0}
              startIcon={<DollarSign className="h-4 w-4 text-emerald-400" />}
              helperText="Set to 0 if institutional waiver applies."
            />

            <div className="space-y-1.5">
              <label
                htmlFor="currency"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Escrow Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue={initialData?.currency || "USD"}
                className="flex h-11 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm"
              >
                <option value="USD">USD ($) — US Dollars</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: VISUAL CALIBRATION & HIGH-RESOLUTION IMAGERY */}
      <Card className="border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 h-40 w-40 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-2xl pointer-events-none" />

        <CardHeader className="border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-black text-white shadow-md shadow-emerald-500/20">
              04
            </span>
            <div>
              <CardTitle className="text-base font-extrabold text-white">
                Apparatus Visual Calibration & Photography
              </CardTitle>
              <CardDescription className="text-xs text-slate-400">
                Provide an authentic photograph of the equipment in its active laboratory bay.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="image_file"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Direct Photo Upload (Supabase Storage)
                </label>
                <div className="rounded-xl border border-dashed border-white/20 bg-slate-950/40 p-4 text-center hover:border-emerald-500/50 transition-colors">
                  <Upload className="mx-auto h-6 w-6 text-emerald-400 mb-2" />
                  <input
                    id="image_file"
                    name="image_file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-500/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                  />
                  <p className="mt-2 text-[10px] text-slate-500">
                    Max 5MB (JPEG, PNG, WebP). Cryptographically secured in Supabase bucket.
                  </p>
                </div>
              </div>

              <Input
                id="image_url"
                name="image_url"
                type="url"
                label="Or Direct Image Reference URL"
                placeholder="https://images.unsplash.com/..."
                value={imageUrlPreview}
                onChange={(e) => setImageUrlPreview(e.target.value)}
                startIcon={<Upload className="h-4 w-4 text-emerald-400" />}
                helperText="Paste direct image URL for instant preview."
              />
            </div>

            {/* Live Media Showcase Preview */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 p-4 relative overflow-hidden min-h-[180px]">
              {imageUrlPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrlPreview}
                  alt="Apparatus preview"
                  className="h-full w-full max-h-48 rounded-xl object-cover border border-white/10 shadow-lg"
                  onError={() => setImageUrlPreview("")}
                />
              ) : (
                <div className="flex flex-col items-center text-center p-6 text-slate-500">
                  <Microscope className="h-10 w-10 text-slate-600 mb-2 stroke-[1.5]" />
                  <span className="text-xs font-semibold text-slate-400">Media Preview Canvas</span>
                  <span className="text-[11px] text-slate-600 mt-0.5">
                    Instrument photograph preview will render here upon upload or URL input.
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FLOATING ACTION BAR */}
      <div className="sticky bottom-6 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/15 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-xl">
        <Link href="/my-resources">
          <Button variant="outline" size="md">
            Discard Changes
          </Button>
        </Link>

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            name="status"
            value="draft"
            variant="secondary"
            size="md"
            isLoading={isPending}
          >
            Save as Draft
          </Button>

          <Button
            type="submit"
            name="status"
            value="published"
            variant="teal"
            size="md"
            isLoading={isPending}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isEditing ? "Update & Publish Asset" : "Publish to Institutional Consortium"}</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
