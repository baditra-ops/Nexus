"use client";

import * as React from "react";
import { returnBookingAction } from "../actions";
import { Button } from "@/components/ui/button";
import {
  RotateCcw,
  AlertTriangle,
  Camera,
  CheckCircle2,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Clock,
} from "lucide-react";
import type { BookingWithRelations } from "../types";

interface ReturnDialogProps {
  booking: BookingWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const ISSUE_CATEGORIES = [
  { id: "damage", label: "Physical Damage / Wear" },
  { id: "malfunction", label: "Operational Malfunction" },
  { id: "missing_parts", label: "Missing Cables / Accessories" },
  { id: "cleanliness", label: "Contamination / Cleaning Required" },
  { id: "other", label: "Other Discrepancy" },
];

export function ReturnDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: ReturnDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [conditionNotes, setConditionNotes] = React.useState(
    "Apparatus returned following completed session. Clean and operational."
  );
  const [hasIssues, setHasIssues] = React.useState(false);
  const [selectedIssueTypes, setSelectedIssueTypes] = React.useState<string[]>([]);
  const [selectedPhotos, setSelectedPhotos] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (!isOpen) return null;

  const scheduledEnd = new Date(booking.end_time);
  const now = new Date();
  const isLate = now.getTime() > scheduledEnd.getTime();
  const lateMinutes = isLate
    ? Math.max(0, Math.floor((now.getTime() - scheduledEnd.getTime()) / 60000))
    : 0;

  const formatLateDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hrs = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    const valid = newFiles.filter((f) => {
      if (f.size > 5 * 1024 * 1024) {
        alert(`File ${f.name} exceeds 5MB limit.`);
        return false;
      }
      return true;
    });
    const updated = [...selectedPhotos, ...valid].slice(0, 5);
    setSelectedPhotos(updated);
    setPreviewUrls(updated.map((f) => URL.createObjectURL(f)));
  };

  const removePhoto = (index: number) => {
    const updated = selectedPhotos.filter((_, i) => i !== index);
    setSelectedPhotos(updated);
    setPreviewUrls(updated.map((f) => URL.createObjectURL(f)));
  };

  const toggleIssueType = (typeId: string) => {
    setSelectedIssueTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("booking_id", booking.id);
      formData.append("condition_notes", conditionNotes);
      formData.append("issues_flagged", hasIssues ? "true" : "false");

      if (hasIssues) {
        selectedIssueTypes.forEach((type) => {
          formData.append("issue_types", type);
        });
      }

      selectedPhotos.forEach((file) => {
        formData.append("photos", file);
      });

      const res = await returnBookingAction(formData);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Return submission failed.");
      }
    });
  };

  const resource = booking.resource;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-dialog-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-white/15 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl my-8">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-400 shadow-sm">
                <RotateCcw className="h-5 w-5" />
              </span>
              <h2
                id="return-dialog-title"
                className="text-lg font-bold text-white"
              >
                Apparatus Return Confirmation
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Submit return condition report for{" "}
              <strong className="text-white">{resource?.title}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Lateness notice */}
        {isLate ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">Late Return Recorded:</span> Scheduled return was at{" "}
              {scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} (
              {formatLateDuration(lateMinutes)} past deadline). This timestamp will be logged on the inspection record.
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>On-time return. Expected deadline: {scheduledEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Condition Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Return Condition Summary
            </label>
            <textarea
              rows={3}
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              placeholder="Describe condition upon return, completed cleaning, consumable levels, or accessories enclosed..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-teal-500 focus:outline-hidden focus:ring-1 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Issue Reporting Checklist */}
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={hasIssues}
                onChange={(e) => setHasIssues(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                Report issues, damage, or anomalies during loan
              </span>
            </label>

            {hasIssues && (
              <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-slate-700">
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Select applicable discrepancy types:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {ISSUE_CATEGORIES.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIssueTypes.includes(cat.id)}
                        onChange={() => toggleIssueType(cat.id)}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{cat.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Return Photos Upload */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Camera className="h-3.5 w-3.5 text-slate-500" />
                Return Condition Photos (Optional, max 5)
              </label>
              <span className="text-[11px] text-slate-400">JPEG, PNG, WebP (≤5MB)</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Return preview ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-0.5 right-0.5 rounded-full bg-slate-900/80 p-0.5 text-white hover:bg-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {selectedPhotos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-teal-500 hover:bg-teal-50/30 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-teal-400"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span className="mt-1 text-[9px] font-medium">Add Photo</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handlePhotoSelect}
              className="hidden"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="teal"
              size="sm"
              isLoading={isPending}
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Submit Return for Custodian Inspection
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
