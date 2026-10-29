"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { getUtilizationInsightsAction, getDemandForecastAction } from "../actions";
import type {
  AIUtilizationInsightsResponse,
  AIDemandForecastResponse,
} from "../types";
import { RESOURCE_CATEGORIES } from "@/features/resources/types";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Calendar,
  Info,
  ExternalLink,
  RefreshCw,
  Sliders,
  Layers,
} from "lucide-react";

interface AIUtilizationDashboardProps {
  institutionName?: string;
}

export function AIUtilizationDashboard({ institutionName }: AIUtilizationDashboardProps) {
  const [subTab, setSubTab] = React.useState<"utilization" | "forecasting">("utilization");

  // Utilization State
  const [utilWindowDays, setUtilWindowDays] = React.useState<number>(30);
  const [utilCategory, setUtilCategory] = React.useState<string>("All");
  const [utilDemoMode, setUtilDemoMode] = React.useState<boolean>(false);
  const [utilLoading, setUtilLoading] = React.useState<boolean>(false);
  const [utilError, setUtilError] = React.useState<string | null>(null);
  const [utilInsufficientData, setUtilInsufficientData] = React.useState<boolean>(false);
  const [utilData, setUtilData] = React.useState<AIUtilizationInsightsResponse | null>(null);

  // Forecasting State
  const [forecastTarget, setForecastTarget] = React.useState<"category" | "platform">("category");
  const [forecastCategory, setForecastCategory] = React.useState<string>("Fabrication & CNC");
  const [forecastHorizon, setForecastHorizon] = React.useState<number>(14);
  const [forecastDemoMode, setForecastDemoMode] = React.useState<boolean>(false);
  const [forecastLoading, setForecastLoading] = React.useState<boolean>(false);
  const [forecastError, setForecastError] = React.useState<string | null>(null);
  const [forecastInsufficientData, setForecastInsufficientData] = React.useState<boolean>(false);
  const [forecastData, setForecastData] = React.useState<AIDemandForecastResponse | null>(null);

  // Fetch Utilization
  const fetchUtilization = React.useCallback(async (demo: boolean = utilDemoMode) => {
    setUtilLoading(true);
    setUtilError(null);
    setUtilInsufficientData(false);

    try {
      const res = await getUtilizationInsightsAction({
        timeWindowDays: utilWindowDays,
        category: utilCategory !== "All" ? utilCategory : undefined,
        underutilizedThreshold: 0.20,
        overutilizedThreshold: 0.75,
        demoMode: demo,
      });

      if (!res.isAvailable) {
        setUtilError("AI microservice is offline or unreachable.");
      } else if (res.insufficientData) {
        setUtilInsufficientData(true);
        setUtilError(res.error || "Insufficient historical data.");
      } else if (res.error) {
        setUtilError(res.error);
      } else if (res.data) {
        setUtilData(res.data);
      }
    } catch (err: unknown) {
      setUtilError(err instanceof Error ? err.message : "Failed to fetch utilization insights.");
    } finally {
      setUtilLoading(false);
    }
  }, [utilWindowDays, utilCategory, utilDemoMode]);

  // Fetch Forecasting
  const fetchForecast = React.useCallback(async (demo: boolean = forecastDemoMode) => {
    setForecastLoading(true);
    setForecastError(null);
    setForecastInsufficientData(false);

    try {
      const res = await getDemandForecastAction({
        forecastTarget: forecastTarget,
        targetIdentifier: forecastTarget === "category" ? forecastCategory : undefined,
        forecastHorizonDays: forecastHorizon,
        demoMode: demo,
      });

      if (!res.isAvailable) {
        setForecastError("AI microservice is offline or unreachable.");
      } else if (res.insufficientData) {
        setForecastInsufficientData(true);
        setForecastError(res.error || "Insufficient historical records for model training.");
      } else if (res.error) {
        setForecastError(res.error);
      } else if (res.data) {
        setForecastData(res.data);
      }
    } catch (err: unknown) {
      setForecastError(err instanceof Error ? err.message : "Failed to project demand forecast.");
    } finally {
      setForecastLoading(false);
    }
  }, [forecastTarget, forecastCategory, forecastHorizon, forecastDemoMode]);

  // Initial load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      void fetchUtilization(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUtilization]);

  React.useEffect(() => {
    if (subTab === "forecasting" && !forecastData && !forecastLoading) {
      const timer = setTimeout(() => {
        void fetchForecast(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [subTab, forecastData, forecastLoading, fetchForecast]);

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-teal-950 via-slate-900 to-slate-900 text-white border border-teal-900/50 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-400" />
            <h3 className="text-base font-bold">
              AI Decision Intelligence & Capacity Analytics
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-300">
            Automated idle resource detection, bottleneck mitigation, and Scikit-learn Ridge Regression demand projection for {institutionName || "your institution"}.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
          <button
            type="button"
            onClick={() => setSubTab("utilization")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              subTab === "utilization"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Utilization & Bottlenecks
          </button>
          <button
            type="button"
            onClick={() => setSubTab("forecasting")}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              subTab === "forecasting"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Demand Forecasting (ML vs Baseline)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UTILIZATION & BOTTLENECK ANALYSIS */}
      {/* ========================================================================= */}
      {subTab === "utilization" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Time Window:</span>
                <select
                  value={utilWindowDays}
                  onChange={(e) => setUtilWindowDays(Number(e.target.value))}
                  className="rounded-md border border-slate-300 bg-white py-1 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days (Standard)</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Category:</span>
                <select
                  value={utilCategory}
                  onChange={(e) => setUtilCategory(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white py-1 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="All">All Categories</option>
                  {RESOURCE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchUtilization(utilDemoMode)}
                disabled={utilLoading}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${utilLoading ? "animate-spin" : ""}`} />
                <span>Re-Analyze</span>
              </Button>
            </div>
          </div>

          {/* Insufficient Data State */}
          {utilInsufficientData && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Insufficient Historical Operational Data</span>
              </div>
              <p>
                {utilError || "Fewer than 5 operational booking records exist within the selected time window. Minimum 5 historical records are required to calculate statistically valid utilization rates."}
              </p>
              <div className="pt-1 flex items-center gap-3">
                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => {
                    setUtilDemoMode(true);
                    fetchUtilization(true);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Inspect Sample Benchmark Dataset (Demo Mode)</span>
                </Button>
              </div>
            </div>
          )}

          {/* Demo Mode Notice */}
          {utilData?.is_demo_data && (
            <div className="p-3 rounded-lg border border-teal-200 bg-teal-50 text-teal-900 text-xs dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Demonstration Dataset Active</span>
                  <p className="mt-0.5 text-2xs opacity-90">{utilData.data_limitation_warning}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUtilDemoMode(false);
                  fetchUtilization(false);
                }}
                className="text-2xs py-1 h-7 border-teal-300 text-teal-800 dark:text-teal-200 shrink-0"
              >
                Switch to Live Data
              </Button>
            </div>
          )}

          {/* Loading */}
          {utilLoading && (
            <div className="py-12">
              <LoadingState message="Computing operational hours, idle ratios, and bottleneck thresholds..." />
            </div>
          )}

          {/* Utilization Metrics Content */}
          {utilData && !utilLoading && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                      Evaluated Assets
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {utilData.total_resources_evaluated}
                      </span>
                      <span className="text-2xs text-slate-400">
                        {utilData.time_window_days}-day window
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                      Average Platform Utilization
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {utilData.average_platform_utilization_percentage}
                      </span>
                      <Badge variant="teal" className="text-3xs">
                        Target: 40-70%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                      Underutilized Assets (&lt;20%)
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                        {utilData.underutilized_resources_count}
                      </span>
                      <span className="text-2xs text-amber-600/80 flex items-center gap-0.5 font-medium">
                        <ArrowDownRight className="h-3 w-3" /> Actionable
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800">
                  <CardContent className="p-4">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                      Capacity Bottlenecks (&gt;75%)
                    </span>
                    <div className="mt-1 flex items-baseline justify-between">
                      <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                        {utilData.bottleneck_resources_count}
                      </span>
                      <span className="text-2xs text-rose-600/80 flex items-center gap-0.5 font-medium">
                        <ArrowUpRight className="h-3 w-3" /> High Demand
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Peak Demand Patterns */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-teal-600" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Observed Peak Demand Patterns (Historical Schedule Telemetry)
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-2xs text-slate-500 block">Busiest Day:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {utilData.peak_demand_patterns.busiest_day_of_week}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-2xs text-slate-500 block">Peak Window:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {utilData.peak_demand_patterns.busiest_time_slot}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-2xs text-slate-500 block">Lowest Demand Day:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {utilData.peak_demand_patterns.lowest_demand_day_of_week}
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <span className="text-2xs text-slate-500 block">Low Demand Window:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {utilData.peak_demand_patterns.lowest_demand_time_slot}
                    </span>
                  </div>
                </div>
              </div>

              {/* Underutilized Assets Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowDownRight className="h-4 w-4 text-amber-500" />
                    <span>Underutilized Apparatus Requiring Intervention ({utilData.underutilized_resources.length})</span>
                  </h4>
                </div>

                {utilData.underutilized_resources.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    No underutilized resources flagged below 20% in this period.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {utilData.underutilized_resources.map((res) => (
                      <div
                        key={res.resource_id}
                        className="p-4 rounded-xl border border-amber-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                              {res.title}
                            </h5>
                            <span className="text-2xs text-slate-500">{res.category}</span>
                          </div>
                          <Badge variant="warning" className="text-2xs shrink-0">
                            {res.utilization_percentage}
                          </Badge>
                        </div>

                        {/* Observed Stats */}
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/50 text-2xs">
                          <div>
                            <span className="text-slate-400 block">Booked:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {res.total_booked_hours.toFixed(1)} hrs
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Available:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {res.total_available_hours.toFixed(1)} hrs
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Total Bookings:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {res.booking_count}
                            </span>
                          </div>
                        </div>

                        {/* AI Generated Recommendation */}
                        <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
                          <span className="font-bold text-2xs uppercase tracking-wider block text-amber-800 dark:text-amber-300 mb-0.5">
                            AI Actionable Suggestion:
                          </span>
                          <p className="text-2xs leading-relaxed">{res.actionable_recommendation}</p>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/resources/${res.resource_id}`}
                            className="inline-flex items-center gap-1 text-2xs font-semibold text-teal-600 hover:text-teal-700"
                          >
                            <span>View Resource Listing</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bottleneck Assets Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="h-4 w-4 text-rose-500" />
                    <span>High-Demand Bottlenecks (&gt;75% Capacity or Waitlisted) ({utilData.high_demand_resources.length})</span>
                  </h4>
                </div>

                {utilData.high_demand_resources.length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                    No bottleneck resources exceeding 75% in this period.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {utilData.high_demand_resources.map((res) => (
                      <div
                        key={res.resource_id}
                        className="p-4 rounded-xl border border-rose-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                              {res.title}
                            </h5>
                            <span className="text-2xs text-slate-500">{res.category}</span>
                          </div>
                          <Badge variant="danger" className="text-2xs shrink-0">
                            {res.utilization_percentage}
                          </Badge>
                        </div>

                        {/* Observed Stats */}
                        <div className="grid grid-cols-3 gap-2 p-2 rounded-md bg-slate-50 dark:bg-slate-800/50 text-2xs">
                          <div>
                            <span className="text-slate-400 block">Booked:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {res.total_booked_hours.toFixed(1)} hrs
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Completed:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {res.completed_bookings}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Waitlist/Rejected:</span>
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {res.waitlisted_or_rejected}
                            </span>
                          </div>
                        </div>

                        {/* AI Generated Recommendation */}
                        <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200">
                          <span className="font-bold text-2xs uppercase tracking-wider block text-rose-800 dark:text-rose-300 mb-0.5">
                            Capacity Mitigation Suggestion:
                          </span>
                          <p className="text-2xs leading-relaxed">{res.actionable_recommendation}</p>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <Link
                            href={`/resources/${res.resource_id}`}
                            className="inline-flex items-center gap-1 text-2xs font-semibold text-teal-600 hover:text-teal-700"
                          >
                            <span>View Resource Listing</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Category Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-teal-600" />
                  <span>Category-Level Utilization Distribution</span>
                </h4>
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-2xs dark:bg-slate-800/80 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Category</th>
                        <th className="py-2.5 px-3 font-semibold">Assets</th>
                        <th className="py-2.5 px-3 font-semibold">Average Utilization</th>
                        <th className="py-2.5 px-3 font-semibold">Total Booked Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {utilData.category_summaries.map((cat) => (
                        <tr key={cat.category} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                            {cat.category}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {cat.resource_count}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {cat.average_utilization_percentage}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            {cat.total_booking_hours.toFixed(1)} hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DEMAND FORECASTING (BASELINE VS ML MODEL) */}
      {/* ========================================================================= */}
      {subTab === "forecasting" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 text-xs shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Target Level:</span>
                <select
                  value={forecastTarget}
                  onChange={(e) => setForecastTarget(e.target.value as "category" | "platform")}
                  className="rounded-md border border-slate-300 bg-white py-1 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="category">Category Level</option>
                  <option value="platform">Platform-Wide Aggregate</option>
                </select>
              </div>

              {forecastTarget === "category" && (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Category:</span>
                  <select
                    value={forecastCategory}
                    onChange={(e) => setForecastCategory(e.target.value)}
                    className="rounded-md border border-slate-300 bg-white py-1 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {RESOURCE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Forecast Horizon:</span>
                <select
                  value={forecastHorizon}
                  onChange={(e) => setForecastHorizon(Number(e.target.value))}
                  className="rounded-md border border-slate-300 bg-white py-1 px-2 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value={7}>7 Days (1 Week)</option>
                  <option value={14}>14 Days (2 Weeks)</option>
                  <option value={21}>21 Days (3 Weeks)</option>
                  <option value={30}>30 Days (1 Month)</option>
                  <option value={60}>60 Days (2 Months)</option>
                </select>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchForecast(forecastDemoMode)}
              disabled={forecastLoading}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${forecastLoading ? "animate-spin" : ""}`} />
              <span>Generate Forecast</span>
            </Button>
          </div>

          {/* Insufficient Data Banner */}
          {forecastInsufficientData && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Insufficient Historical Records for Ridge ML Training</span>
              </div>
              <p>
                {forecastError || "Demand forecasting requires at least 14 daily operational records across past booking schedules to train calendar lag features and evaluate against moving averages."}
              </p>
              <div className="pt-1 flex items-center gap-3">
                <Button
                  variant="teal"
                  size="sm"
                  onClick={() => {
                    setForecastDemoMode(true);
                    fetchForecast(true);
                  }}
                  className="text-xs gap-1.5"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Inspect Sample Benchmark Forecast (Demo Mode)</span>
                </Button>
              </div>
            </div>
          )}

          {/* Demo Mode Notice */}
          {forecastData?.is_demo_data && (
            <div className="p-3 rounded-lg border border-teal-200 bg-teal-50 text-teal-900 text-xs dark:border-teal-900 dark:bg-teal-950/40 dark:text-teal-200 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Synthetic Benchmark Dataset Active</span>
                  <p className="mt-0.5 text-2xs opacity-90">{forecastData.data_limitation_warning}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setForecastDemoMode(false);
                  fetchForecast(false);
                }}
                className="text-2xs py-1 h-7 border-teal-300 text-teal-800 dark:text-teal-200 shrink-0"
              >
                Switch to Live Data
              </Button>
            </div>
          )}

          {/* Loading */}
          {forecastLoading && (
            <div className="py-12">
              <LoadingState message="Training Scikit-learn Ridge Regression with calendar periodicity and auto-regressive lags..." />
            </div>
          )}

          {/* Forecast Results */}
          {forecastData && !forecastLoading && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Model Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Baseline Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-slate-500">
                      Baseline Benchmark Model
                    </span>
                    <Badge variant="neutral" className="text-2xs">
                      Moving Average
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {forecastData.baseline_model_metrics.model_name}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-2xs text-slate-400 block">Mean Absolute Error (MAE):</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {forecastData.baseline_model_metrics.mean_absolute_error_hours.toFixed(2)} hrs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-2xs text-slate-400 block">RMSE:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                        {forecastData.baseline_model_metrics.root_mean_squared_error_hours.toFixed(2)} hrs
                      </span>
                    </div>
                  </div>
                  <p className="text-2xs text-slate-500 leading-relaxed">
                    {forecastData.baseline_model_metrics.evaluation_description}
                  </p>
                </div>

                {/* ML Model Card */}
                <div className="p-4 rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/50 to-white dark:border-teal-900/60 dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Machine Learning Engine (Priority 3)
                    </span>
                    <Badge variant="teal" className="text-2xs">
                      Ridge Regression
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {forecastData.ml_model_metrics.model_name}
                  </h4>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-teal-100 dark:border-teal-900/30">
                      <span className="text-2xs text-slate-400 block">MAE:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">
                        {forecastData.ml_model_metrics.mean_absolute_error_hours.toFixed(2)} hrs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-teal-100 dark:border-teal-900/30">
                      <span className="text-2xs text-slate-400 block">RMSE:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">
                        {forecastData.ml_model_metrics.root_mean_squared_error_hours.toFixed(2)} hrs
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800/70 border border-teal-100 dark:border-teal-900/30">
                      <span className="text-2xs text-slate-400 block">R² Score:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 text-sm">
                        {forecastData.ml_model_metrics.r2_score !== null && forecastData.ml_model_metrics.r2_score !== undefined
                          ? forecastData.ml_model_metrics.r2_score.toFixed(2)
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                  <p className="text-2xs text-teal-900/80 dark:text-teal-200/80 leading-relaxed">
                    {forecastData.ml_model_metrics.evaluation_description}
                  </p>
                </div>
              </div>

              {/* Comparative Summary Callout */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3 text-xs">
                <TrendingUp className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-900 dark:text-white">
                    Empirical Model Comparison
                  </h5>
                  <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed text-2xs">
                    {forecastData.model_comparison_summary}
                  </p>
                </div>
              </div>

              {/* Daily Projections Timeline / Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <span>
                      Daily Demand Projection ({forecastData.daily_forecasts.length} Days Horizon)
                    </span>
                  </h4>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-2xs dark:bg-slate-800/80 dark:border-slate-800">
                      <tr>
                        <th className="py-2.5 px-3 font-semibold">Date</th>
                        <th className="py-2.5 px-3 font-semibold">Day of Week</th>
                        <th className="py-2.5 px-3 font-semibold">Type</th>
                        <th className="py-2.5 px-3 font-semibold">Predicted Booked Time</th>
                        <th className="py-2.5 px-3 font-semibold">Estimated Reservations</th>
                        <th className="py-2.5 px-3 font-semibold">Confidence Interval (hrs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {forecastData.daily_forecasts.map((pt) => (
                        <tr
                          key={pt.date}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/40 ${
                            pt.is_weekend ? "bg-slate-50/30 dark:bg-slate-800/20" : ""
                          }`}
                        >
                          <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white font-mono text-2xs">
                            {pt.date}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                            {pt.day_of_week}
                          </td>
                          <td className="py-2.5 px-3">
                            <Badge
                              variant={pt.is_weekend ? "neutral" : "teal"}
                              className="text-3xs py-0"
                            >
                              {pt.is_weekend ? "Weekend" : "Weekday"}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                            {pt.predicted_booked_hours.toFixed(1)} hrs
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                            ~{pt.predicted_booking_count} bookings
                          </td>
                          <td className="py-2.5 px-3 text-2xs text-slate-500 dark:text-slate-400">
                            [{pt.confidence_lower_hours.toFixed(1)} – {pt.confidence_upper_hours.toFixed(1)}] hrs
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Assumptions & Limitations Accordion */}
              {forecastData.assumptions_and_limitations.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-2xs uppercase tracking-wider">
                    <Info className="h-3.5 w-3.5 text-slate-500" />
                    <span>Scientific Modeling Assumptions & Limitations</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-2xs text-slate-600 dark:text-slate-400">
                    {forecastData.assumptions_and_limitations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
