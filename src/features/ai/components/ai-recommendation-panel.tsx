"use client";

import * as React from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { getRecommendationsAction } from "../actions";
import type { AIRecommendationResponse } from "../types";
import { RESOURCE_CATEGORIES } from "@/features/resources/types";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Compass,
} from "lucide-react";

interface AIRecommendationPanelProps {
  initialOpen?: boolean;
}

export function AIRecommendationPanel({ initialOpen = false }: AIRecommendationPanelProps) {
  const [isOpen, setIsOpen] = React.useState(initialOpen);
  const [purpose, setPurpose] = React.useState("");
  const [category, setCategory] = React.useState<string>("All");
  const [specsInput, setSpecsInput] = React.useState("");
  const [maxDeposit, setMaxDeposit] = React.useState<string>("");
  const [crossInstitution, setCrossInstitution] = React.useState<boolean>(true);
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isServiceOffline, setIsServiceOffline] = React.useState(false);
  const [result, setResult] = React.useState<AIRecommendationResponse | null>(null);
  const [expandedCardId, setExpandedCardId] = React.useState<string | null>(null);

  // Quick preset queries for demonstration
  const setPreset = (
    presetPurpose: string,
    presetCategory: string,
    presetSpecs: string
  ) => {
    setPurpose(presetPurpose);
    setCategory(presetCategory);
    setSpecsInput(presetSpecs);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purpose.trim() || purpose.trim().length < 3) {
      setError("Please describe your research or testing purpose (min 3 characters).");
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsServiceOffline(false);

    const specs = specsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const response = await getRecommendationsAction({
        purposeDescription: purpose.trim(),
        category: category !== "All" ? category : undefined,
        requiredSpecifications: specs,
        maxDeposit: maxDeposit ? parseFloat(maxDeposit) : undefined,
        crossInstitutionAllowed: crossInstitution,
        requestedStartTime: startDate ? new Date(startDate).toISOString() : undefined,
        requestedEndTime: endDate ? new Date(endDate).toISOString() : undefined,
        limit: 5,
      });

      if (!response.isAvailable) {
        setIsServiceOffline(true);
        setError(response.error || "AI service is offline.");
      } else if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setResult(response.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate AI recommendations.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="teal"
        size="sm"
        className="gap-2 shadow-xs"
        aria-label="Open AI matching recommendation assistant"
      >
        <Sparkles className="h-4 w-4 text-teal-200 animate-pulse" />
        <span className="font-medium">AI Matching Assistant</span>
      </Button>

      {/* Main Dialog Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  AI-Assisted Resource Recommendation Engine
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Multivariate matching based on research purpose, technical specifications, safety prerequisites, schedule fit, and campus affinity.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Invariant Banner */}
          <div className="mt-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 flex items-start gap-2">
            <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
            <span>
              <strong>Advisory Decision Support</strong>: Final booking approvals, safety verification, and access rights are exclusively enforced by the primary Nexus backend and institutional administrators.
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSearch} className="mt-4 space-y-4">
            <div>
              <label htmlFor="ai-purpose-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Project / Research Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                id="ai-purpose-input"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Need a digital storage oscilloscope for high-frequency signal debugging and logic analysis..."
                rows={2}
                className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2.5 shadow-2xs focus:border-teal-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-500 text-2xs font-medium uppercase tracking-wider">Example Presets:</span>
              <button
                type="button"
                onClick={() => setPreset("Need a digital storage oscilloscope for high-frequency signal debugging", "Electronics & Embedded Kits", "4 channels, 1 GHz, digital storage")}
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs transition-colors dark:bg-slate-800 dark:text-slate-300"
              >
                ⚡ Oscilloscope
              </button>
              <button
                type="button"
                onClick={() => setPreset("Precision 5-axis CNC machining for titanium aerospace bracket fabrication", "Fabrication & CNC", "5-axis, coolant flood, titanium")}
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs transition-colors dark:bg-slate-800 dark:text-slate-300"
              >
                ⚙️ 5-Axis CNC
              </button>
              <button
                type="button"
                onClick={() => setPreset("High-resolution field emission scanning electron microscopy for elemental mapping", "Optics & Imaging", "sub-nanometer, EDS, high-vacuum")}
                className="px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xs transition-colors dark:bg-slate-800 dark:text-slate-300"
              >
                🔬 Electron Microscope
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="ai-category-select" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Target Category
                </label>
                <Select
                  id="ai-category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs"
                  options={[
                    { value: "All", label: "All Categories" },
                    ...RESOURCE_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                  ]}
                />
              </div>

              <div>
                <label htmlFor="ai-specs-input" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Required Specs (Comma Separated)
                </label>
                <Input
                  id="ai-specs-input"
                  value={specsInput}
                  onChange={(e) => setSpecsInput(e.target.value)}
                  placeholder="e.g. 4 channels, 1 GHz, digital storage"
                  className="text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="ai-max-deposit" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Max Deposit ($)
                </label>
                <Input
                  id="ai-max-deposit"
                  type="number"
                  min="0"
                  step="10"
                  value={maxDeposit}
                  onChange={(e) => setMaxDeposit(e.target.value)}
                  placeholder="Optional"
                  className="text-xs"
                />
              </div>

              <div>
                <label htmlFor="ai-start-time" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Desired Start Window
                </label>
                <Input
                  id="ai-start-time"
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <label htmlFor="ai-end-time" className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Desired End Window
                </label>
                <Input
                  id="ai-end-time"
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="ai-cross-inst"
                checked={crossInstitution}
                onChange={(e) => setCrossInstitution(e.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 dark:border-slate-700"
              />
              <label htmlFor="ai-cross-inst" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                Include shared resources from partner university consortiums
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setPurpose("");
                  setCategory("All");
                  setSpecsInput("");
                  setResult(null);
                  setError(null);
                }}
              >
                Reset
              </Button>

              <Button
                type="submit"
                variant="teal"
                size="sm"
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Apparatus Specs...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Ranked Matches</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Loading State */}
          {isLoading && (
            <div className="py-8">
              <LoadingState message="Executing TF-IDF vectorization and verifying prerequisites..." />
            </div>
          )}

          {/* Recoverable Offline Error State */}
          {isServiceOffline && (
            <div className="mt-6 p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>AI Recommendation Service Offline</span>
              </div>
              <p className="text-xs">
                The standalone AI microservice at <code>http://127.0.0.1:8000</code> is currently offline or unreachable. Standard Nexus catalog discovery, faceted search, and bookings remain fully operational.
              </p>
              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearch}
                  className="text-xs border-amber-300 bg-white hover:bg-amber-100 dark:bg-amber-900/50"
                >
                  Retry Connection
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-xs"
                >
                  Use Standard Search Below
                </Button>
              </div>
            </div>
          )}

          {/* Standard Error */}
          {error && !isServiceOffline && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs dark:bg-red-950/30 dark:border-red-900 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Results Section */}
          {result && !isLoading && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Ranked Matches ({result.recommendations_count} of {result.total_candidates_analyzed} Evaluated)
                  </h3>
                  <Badge variant="teal" className="text-2xs">
                    Explainable AI (Priority 4)
                  </Badge>
                </div>
                {result.user_status_notice && (
                  <Badge variant="warning" className="text-2xs">
                    {result.user_status_notice}
                  </Badge>
                )}
              </div>

              {result.recommendations.length === 0 ? (
                <EmptyState
                  icon={<Compass className="h-6 w-6 text-slate-400" />}
                  title="No matching apparatus found"
                  description="Try relaxing your technical specifications, increasing the max deposit, or choosing 'All Categories'."
                />
              ) : (
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => {
                    const isExpanded = expandedCardId === rec.resource_id;
                    const score = Math.round(rec.match_score_percentage);
                    const isHighMatch = score >= 80;

                    return (
                      <div
                        key={rec.resource_id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs hover:border-teal-500/50 transition-colors dark:border-slate-800 dark:bg-slate-900"
                      >
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                #{index + 1}
                              </span>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                {rec.title}
                              </h4>
                              {rec.live_resource_verified && (
                                <Badge variant="neutral" className="text-3xs py-0">
                                  Verified Live Resource
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-2xs text-slate-500 dark:text-slate-400 flex-wrap">
                              <span>{rec.category}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {rec.institution_name || "Nexus Partner University"}
                              </span>
                              {rec.location && (
                                <>
                                  <span>•</span>
                                  <span>{rec.location}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                Deposit: ${rec.deposit_amount.toFixed(2)} {rec.currency}
                              </span>
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className="text-right shrink-0">
                            <div
                              className={`text-sm font-black px-2.5 py-1 rounded-lg ${
                                isHighMatch
                                  ? "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800"
                                  : "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800"
                              }`}
                            >
                              {score}% Match
                            </div>
                          </div>
                        </div>

                        {/* Status Pills */}
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {rec.is_eligible ? (
                            <Badge variant="teal" className="text-2xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              <span>Prerequisites Satisfied</span>
                            </Badge>
                          ) : (
                            <Badge variant="warning" className="text-2xs gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              <span>{rec.action_required || "Training Prerequisite Required"}</span>
                            </Badge>
                          )}

                          {rec.is_available ? (
                            <Badge variant="neutral" className="text-2xs gap-1">
                              <Clock className="h-3 w-3 text-emerald-500" />
                              <span>Slot Available</span>
                            </Badge>
                          ) : (
                            <Badge variant="neutral" className="text-2xs gap-1 text-slate-500">
                              <Clock className="h-3 w-3 text-amber-500" />
                              <span>Schedule Conflict / Closed</span>
                            </Badge>
                          )}
                        </div>

                        {/* High-level explanation */}
                        <p className="mt-2.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {rec.explanation.summary}
                        </p>

                        {/* Matched Capabilities Tags */}
                        {rec.explanation.matched_capabilities.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-3xs uppercase font-bold text-slate-400">Matched Specs:</span>
                            {rec.explanation.matched_capabilities.map((cap) => (
                              <span
                                key={cap}
                                className="px-1.5 py-0.5 rounded-sm bg-teal-50 text-teal-700 text-3xs font-medium dark:bg-teal-950/30 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                              >
                                ✓ {cap}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Actions Row */}
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => toggleExpand(rec.resource_id)}
                            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                          >
                            <span>{isExpanded ? "Hide Matching Breakdown" : "Inspect AI Scoring Breakdown"}</span>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          </button>

                          <Link
                            href={`/resources/${rec.resource_id}`}
                            className="inline-flex items-center gap-1 font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
                          >
                            <span>Inspect Apparatus Details</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </div>

                        {/* Expandable Breakdown Drawer */}
                        {isExpanded && (
                          <div className="mt-3 p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs animate-in fade-in duration-150">
                            <div>
                              <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                                Scoring Breakdown (Multi-Factor Composite Model)
                              </h5>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-2xs">
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-500 block">TF-IDF Spec Similarity</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {(rec.scoring_breakdown.spec_similarity_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-500 block">Capability Coverage</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {(rec.scoring_breakdown.capability_coverage_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-500 block">Safety & Prerequisite</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {(rec.scoring_breakdown.safety_eligibility_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-500 block">Schedule Availability</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {(rec.scoring_breakdown.availability_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-500 block">Campus Affinity</span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {(rec.scoring_breakdown.institution_affinity_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                  <span className="text-slate-500 block">Overall Composite Score</span>
                                  <span className="font-bold text-teal-600 dark:text-teal-400">
                                    {(rec.scoring_breakdown.overall_score * 100).toFixed(1)}%
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5 pt-1 text-2xs text-slate-600 dark:text-slate-300">
                              <div>
                                <strong>Safety Protocol:</strong> {rec.explanation.safety_and_certification}
                              </div>
                              <div>
                                <strong>Availability:</strong> {rec.explanation.availability_assessment}
                              </div>
                              <div>
                                <strong>Campus Context:</strong> {rec.explanation.institutional_context}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
