import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { FarmService, CowService } from "../services/api";
import { Button } from "../components/ui";
import {
  Milk,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Activity,
  Map,
  Calendar,
  Search,
  X,
  ArrowUpRight,
  Tractor,
  Leaf,
  Droplets,
  RefreshCcw,
  Database,
  BarChart3,
} from "lucide-react";
import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [lastSynced, setLastSynced] = useState(
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: farms, isLoading: farmsLoading } = useQuery({
    queryKey: ["farms"],
    queryFn: FarmService.getAll,
  });
  const { data: cows, isLoading: cowsLoading } = useQuery({
    queryKey: ["cows"],
    queryFn: CowService.getAll,
  });

  // Debounce Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Simulate Data Refresh for Kobo Integration
  const handleRefreshData = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setLastSynced(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
      setIsSyncing(false);
    }, 1500);
  };

  // Filter Logic using debounced term
  const filteredFarms =
    farms?.filter(
      (farm) =>
        farm.owner_name
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        farm.farm_id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    ) || [];

  // Determine active dataset (Global vs Search Results)
  const activeFarms = debouncedSearchTerm ? filteredFarms : farms || [];
  const activeFarmIds = new Set(activeFarms.map((f) => f.farm_id));

  // Filter cows based on active farms
  const activeCows =
    cows?.filter((c) => {
      const farmId =
        typeof c.farm === "string" ? c.farm : (c.farm as any).farm_id;
      return activeFarmIds.has(farmId);
    }) || [];

  // Calculate Stats based on active dataset
  const totalFarms = activeFarms.length;
  // Ensure totalCows matches the actual number of cows in the database (Livestock list)
  // Previously summed farm.total_number_of_cows, which caused discrepancies with backend data
  const totalCows = cows ? cows.length : 0;

  const sickCows = activeCows.filter((c) => c.status === "Sick").length;
  const pregnantCows = activeCows.filter((c) => c.status === "Pregnant").length;
  const totalMilk = activeFarms.reduce((acc, f) => acc + f.total_daily_milk, 0);

  // For the list view
  const displayedFarmsList = debouncedSearchTerm
    ? filteredFarms
    : (farms || []).slice(0, 5);
  const listTitle = debouncedSearchTerm
    ? `Search Results (${filteredFarms.length})`
    : "Recent Activity";

  // Enhanced Animations
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const item: Variants = {
    hidden: { y: 30, opacity: 0, scale: 0.95 },
    show: {
      y: 0,
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 },
    },
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Header Section with Search & Kobo Sync */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-slate-500 dark:text-slate-400">
              Operations Overview
            </p>
            <span className="text-slate-300">•</span>
            <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-100 dark:border-slate-700">
              <Database className="h-3 w-3 text-primary-500" />
              <span>KoboToolbox Synced: {lastSynced}</span>
              <button
                onClick={handleRefreshData}
                className={`ml-1 hover:text-primary-500 transition-transform ${
                  isSyncing ? "animate-spin" : "hover:rotate-180"
                }`}
              >
                <RefreshCcw className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full lg:w-96 group z-10">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all focus:bg-white dark:focus:bg-slate-900 shadow-sm"
            placeholder="Search Farms or Owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Bento Grid Layout */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(160px,auto)]"
      >
        {/* 1. Hero Card: Active Farms (Replaces Total Milk) */}
        <motion.div
          variants={item}
          whileHover={{
            scale: 1.01,
            transition: { type: "spring", stiffness: 400, damping: 17 },
          }}
          onClick={() => navigate("/farms")}
          className="md:col-span-2 lg:col-span-2 lg:row-span-2 group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 p-8 text-white shadow-xl shadow-emerald-900/20 cursor-pointer"
        >
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
                <Tractor className="h-8 w-8 text-white" />
              </div>
              <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium border border-white/10 flex items-center gap-1">
                <Activity className="h-3 w-3" /> Operational
              </div>
            </div>

            <div className="space-y-2 mt-8">
              <h2 className="text-lg font-medium text-emerald-100">
                Active Farms Managed
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl lg:text-8xl font-bold tracking-tighter drop-shadow-sm">
                  {farmsLoading ? "..." : totalFarms}
                </span>
                <span className="text-2xl text-emerald-200 font-medium">
                  Units
                </span>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full bg-emerald-800/50 border border-emerald-400/30 flex items-center justify-center text-[10px] backdrop-blur-sm"
                    >
                      <Leaf className="h-4 w-4 text-emerald-200" />
                    </div>
                  ))}
                </div>
                <p className="text-emerald-100 text-sm opacity-90">
                  Across{" "}
                  {activeFarms.length > 0
                    ? new Set(activeFarms.map((f) => f.cluster_number)).size
                    : 0}{" "}
                  active clusters
                </p>
              </div>
            </div>
          </div>

          {/* Decorative Backgrounds */}
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl border border-white/5"
          />
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 -mb-24 -ml-24 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl"
          />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </motion.div>

        {/* 2. Total Livestock (Swapped Position) */}
        <motion.div
          variants={item}
          whileHover={{ y: -5, transition: { type: "spring", stiffness: 400 } }}
          onClick={() => navigate("/cows")}
          className="md:col-span-1 bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 rounded-[2rem] shadow-lg shadow-violet-500/20 text-white cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white">
              <Activity className="h-6 w-6" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-violet-100 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="relative z-10 mt-auto">
            <p className="text-4xl font-bold mb-1 tracking-tight">
              {cowsLoading ? "..." : totalCows}
            </p>
            <h3 className="text-violet-100 font-medium text-sm uppercase tracking-wide">
              Total Cows
            </h3>
          </div>
          {/* Animated Background Ring */}
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-8 border-white/5 group-hover:scale-125 transition-transform duration-700"></div>
        </motion.div>

        {/* 3. Total Milk Output (Swapped Position) */}
        <motion.div
          variants={item}
          whileHover={{ y: -5, transition: { type: "spring", stiffness: 400 } }}
          className="md:col-span-1 bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[2rem] shadow-lg shadow-blue-500/20 text-white cursor-default relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl text-white">
              <Milk className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5 text-blue-100 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="relative z-10 mt-auto">
            <div className="flex items-end gap-2 mb-1">
              <p className="text-3xl font-bold tracking-tight">
                {farmsLoading ? "..." : totalMilk.toLocaleString()}
              </p>
              <span className="text-sm mb-1.5 font-medium text-blue-100">
                Liters
              </span>
            </div>
            <h3 className="text-blue-100 font-medium text-sm uppercase tracking-wide">
              Total Milk Output
            </h3>
          </div>
          <Droplets className="absolute -bottom-4 -right-4 h-32 w-32 text-blue-400/20 rotate-12 group-hover:scale-110 transition-transform duration-500" />
        </motion.div>

        {/* 4. Health Alerts */}
        <motion.div
          variants={item}
          whileHover={{ y: -5, transition: { type: "spring", stiffness: 400 } }}
          onClick={() => navigate("/cows")}
          className={`md:col-span-1 p-6 rounded-[2rem] border shadow-sm cursor-pointer relative overflow-hidden group ${
            sickCows > 0
              ? "bg-white dark:bg-slate-900 border-rose-200 dark:border-rose-900"
              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div
              className={`p-3 rounded-2xl ${
                sickCows > 0
                  ? "bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              <AlertCircle className="h-6 w-6" />
            </div>
            {sickCows > 0 && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>
          <div className="relative z-10">
            <p
              className={`text-4xl font-bold mb-1 tracking-tight ${
                sickCows > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {sickCows}
            </p>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wide group-hover:text-rose-500 transition-colors">
              Health Alerts
            </h3>
          </div>
        </motion.div>

        {/* 5. Pregnancies */}
        <motion.div
          variants={item}
          whileHover={{ y: -5, transition: { type: "spring", stiffness: 400 } }}
          onClick={() => navigate("/cows")}
          className="md:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer relative overflow-hidden group"
        >
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-2xl text-amber-600 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
              {pregnantCows}
            </p>
            <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm uppercase tracking-wide group-hover:text-amber-500 transition-colors">
              Pregnancies
            </h3>
          </div>
        </motion.div>

        {/* 6. Detailed List */}
        <motion.div variants={item} className="md:col-span-3 lg:col-span-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400 shadow-sm">
                  <Map className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                  {listTitle}
                </h3>
              </div>
              {!debouncedSearchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full px-4 text-slate-600 dark:text-slate-400"
                  onClick={() => navigate("/farms")}
                >
                  View All <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900">
                  <tr>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Farm Details
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Contact Info
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Livestock
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider">
                      Hygiene
                    </th>
                    <th className="px-6 py-4 font-semibold tracking-wider text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {displayedFarmsList.length > 0 ? (
                    displayedFarmsList.map((farm) => (
                      <tr
                        key={farm.farm_id}
                        className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold shadow-inner text-sm">
                              {farm.owner_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {farm.owner_name}
                              </div>
                              <div className="text-xs text-slate-500 font-mono">
                                {farm.farm_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs bg-slate-100 dark:bg-slate-800 w-fit px-2 py-0.5 rounded-md font-medium">
                              {farm.telephone_number}
                            </span>
                            <span className="truncate max-w-[150px] text-xs opacity-80">
                              {farm.address}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {cows
                                  ? cows.filter(
                                      (c) =>
                                        c.farm === farm.farm_id ||
                                        (typeof c.farm === "object" &&
                                          c.farm.farm_id === farm.farm_id)
                                    ).length
                                  : 0}
                              </span>
                              <span className="text-slate-400 scale-90">
                                Total
                              </span>
                            </div>
                            <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2"></div>
                            <div className="flex flex-col items-center">
                              <span className="font-bold text-primary-600 text-sm">
                                {cows
                                  ? cows.filter(
                                      (c) =>
                                        (c.farm === farm.farm_id ||
                                          (typeof c.farm === "object" &&
                                            c.farm.farm_id === farm.farm_id)) &&
                                        c.status === "Lactating"
                                    ).length
                                  : 0}
                              </span>
                              <span className="text-slate-400 scale-90">
                                Milking
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4].map((star) => (
                              <div
                                key={star}
                                className={`h-1.5 w-4 rounded-full transition-all ${
                                  star <= farm.farm_hygiene_score
                                    ? "bg-emerald-500"
                                    : "bg-slate-200 dark:bg-slate-700"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-medium text-slate-400 mt-1 block uppercase tracking-wide">
                            {farm.farm_hygiene_score >= 3 ? "Good" : "Poor"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 dark:hover:bg-slate-800 dark:hover:text-white"
                            onClick={() => navigate(`/farms/${farm.farm_id}`)}
                          >
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                            <Search className="h-8 w-8 opacity-50" />
                          </div>
                          <p className="text-lg font-medium text-slate-900 dark:text-white">
                            No matching farms found
                          </p>
                          <p className="text-sm mb-4">
                            Try adjusting your search.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchTerm("")}
                          >
                            Clear Search
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
