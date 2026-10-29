"use client";

import * as React from "react";
import { reportIncidentAction } from "../actions";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Camera,
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  Send,
} from "lucide-react";
import type { BookingWithRelations } from "../types";

interface IncidentDialogProps {
  booking: BookingWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function IncidentDialog({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: IncidentDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [incidentType, setIncidentType] = React.useState("damage");
  const [description, setDescription] = React.useState("");
  const [selectedPhotos, setSelectedPhotos] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  if (!isOpen) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg("Please provide an incident description.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("booking_id", booking.id);
      formData.append("incident_type", incidentType);
      formData.append("description", description);

      selectedPhotos.forEach((file) => {
        formData.append("photos", file);
      });

      const res = await reportIncidentAction(formData);
      if (res.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Incident report could not be filed.");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="incident-dialog-title"
    >
      <div className="relative w-full max-w-xl rounded-2xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl my-8 shadow-rose-950/30">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-950/80 border border-rose-500/30 text-rose-400 shadow-sm">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <h2
                id="incident-dialog-title"
                className="text-lg font-bold text-white"
              >
                Report Apparatus Incident or Discrepancy
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Submit an auditable incident report for{" "}
              <strong className="text-white">{booking.resource?.title}</strong>
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Incident Category
            </label>
            <select
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="damage">Physical Damage / Broken Components</option>
              <option value="malfunction">Operational Malfunction / Software Error</option>
              <option value="missing_parts">Missing Components, Cables, or Adapters</option>
              <option value="safety_concern">Safety Hazard / Biosafety or Chemical Spillage</option>
              <option value="late_dispute">Late Return or Overdue Schedule Dispute</option>
              <option value="incorrect_condition">Inaccurate or Disputed Condition Record</option>
              <option value="other">Other Unresolved Incident</option>
            </select>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-slate-500" />
              Detailed Incident Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a factual summary of what occurred, observable defects, time of occurrence, and any corrective actions taken..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 shadow-2xs focus:border-rose-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              required
            />
          </div>

          {/* Evidence Photos */}
          <div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Camera className="h-3.5 w-3.5 text-slate-500" />
                Evidence Photographs (Optional, max 5)
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
                  <img src={url} alt={`Evidence preview ${idx + 1}`} className="h-full w-full object-cover" />
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
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-rose-500 hover:bg-rose-50/30 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-rose-400"
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
              variant="danger"
              size="sm"
              isLoading={isPending}
            >
              <Send className="h-4 w-4 mr-1.5" />
              Submit Incident Report
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
