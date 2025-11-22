import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { FarmService, CowService } from "../services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  PageLoader,
} from "../components/ui";
import {
  Search,
  PieChart,
  Target,
  Users,
  Tractor,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  AlertCircle,
  Layers,
  ChevronRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ClusterPerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  // Fetch all data
  const { data: farms, isLoading: farmsLoading } = useQuery({
    queryKey: ["farms"],
    queryFn: FarmService.getAll,
  });
  const { data: cows, isLoading: cowsLoading } = useQuery({
    queryKey: ["cows"],
    queryFn: CowService.getAll,
  });

  // Extract Unique Clusters
  const clusters = useMemo(() => {
    if (!farms) return [];
    const unique = new Set(farms.map((f) => f.cluster_number).filter(Boolean));
    return Array.from(unique).map((c) => ({
      id: c as string,
      farmCount: farms.filter((f) => f.cluster_number === c).length,
      cowCount: farms
        .filter((f) => f.cluster_number === c)
        .reduce((acc, f) => acc + f.total_number_of_cows, 0),
    }));
  }, [farms]);

  // Filter Logic
  const filteredClusters = useMemo(() => {
    if (!searchTerm) return clusters;
    return clusters.filter((c) =>
      c.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clusters, searchTerm]);

  // Active Cluster Data
  const activeClusterId =
    selectedCluster ||
    (filteredClusters.length === 1 ? filteredClusters[0].id : null);

  const clusterStats = useMemo(() => {
    if (!activeClusterId || !farms || !cows) return null;

    const clusterFarms = farms.filter(
      (f) => f.cluster_number === activeClusterId
    );
    const clusterFarmIds = new Set(clusterFarms.map((f) => f.farm_id));
    const clusterCows = cows.filter((c) => {
      const farmId =
        typeof c.farm === "string" ? c.farm : (c.farm as any).farm_id;
      return clusterFarmIds.has(farmId);
    });

    // Calculate Metrics
    let totalInsemDays = 0;
    let insemCount = 0;
    let totalInsemPerConception = 0;
    let pregnantCount = 0;
    let repeatBreeders = 0;
    let inseminatedCowsCount = 0;
    let nonPregnant90Days = 0;
    let cowsPost90Days = 0;

    const now = new Date();

    clusterCows.forEach((cow) => {
      const lastCalving = cow.last_calving_date
        ? new Date(cow.last_calving_date)
        : null;
      const lastInsem = cow.last_date_insemination
        ? new Date(cow.last_date_insemination)
        : null;

      // 1. Insemination after calving
      if (lastCalving && lastInsem && lastInsem > lastCalving) {
        const diffTime = Math.abs(lastInsem.getTime() - lastCalving.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalInsemDays += diffDays;
        insemCount++;
      }

      // 4. Insems per conception (only for pregnant cows)
      if (cow.status === "Pregnant") {
        totalInsemPerConception += cow.number_of_inseminations;
        pregnantCount++;
      }

      // 5. Repeat breeders
      if (cow.number_of_inseminations > 0) {
        inseminatedCowsCount++;
        if (cow.number_of_inseminations >= 3) repeatBreeders++;
      }

      // 6. Non-pregnant > 3 months
      if (lastCalving) {
        const daysSinceCalving = Math.floor(
          (now.getTime() - lastCalving.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceCalving > 90) {
          cowsPost90Days++;
          if (cow.status !== "Pregnant") {
            nonPregnant90Days++;
          }
        }
      }
    });

    // Mock/Fixed Metrics
    const avgCalvingInterval = 13.8;
    const heatAfterCalving = 48.5;

    return {
      farmCount: clusterFarms.length,
      cowCount: clusterCows.length,
      avgYield: (
        clusterFarms.reduce((acc, f) => acc + f.total_daily_milk, 0) /
        clusterFarms.length
      ).toFixed(0),
      avgInsemDays: insemCount
        ? (totalInsemDays / insemCount).toFixed(1)
        : "N/A",
      avgCalvingInterval: avgCalvingInterval.toFixed(1),
      avgHeatDays: heatAfterCalving.toFixed(1),
      insemPerConception: pregnantCount
        ? (totalInsemPerConception / pregnantCount).toFixed(1)
        : "0.0",
      repeatBreederRate: inseminatedCowsCount
        ? ((repeatBreeders / inseminatedCowsCount) * 100).toFixed(1)
        : "0.0",
      nonPreg90DayRate: cowsPost90Days
        ? ((nonPregnant90Days / cowsPost90Days) * 100).toFixed(1)
        : "0.0",
    };
  }, [activeClusterId, farms, cows]);

  const renderTrend = (val: number, target: number, inverse = false) => {
    if (isNaN(val)) return <span className="text-slate-400">-</span>;
    const isGood = inverse ? val <= target : val >= target;
    return isGood ? (
      <div className="flex items-center text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-bold">
        <ArrowUpRight className="h-3 w-3 mr-1" /> Optimal
      </div>
    ) : (
      <div className="flex items-center text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-bold">
        <ArrowDownRight className="h-3 w-3 mr-1" /> Attention
      </div>
    );
  };

  if (farmsLoading || cowsLoading) {
    return <PageLoader variant="inline" />;
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cluster Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Aggregate performance indicators across farm clusters.
          </p>
        </div>

        {selectedCluster && (
          <Button
            variant="outline"
            onClick={() => {
              setSelectedCluster(null);
              setSearchTerm("");
            }}
          >
            View All Clusters
          </Button>
        )}
      </div>

      {/* Search / Selection Area */}
      {!selectedCluster && (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Cluster ID..."
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredClusters.map((cluster) => (
                <motion.div
                  key={cluster.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedCluster(cluster.id)}
                  className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-900 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <PieChart className="h-24 w-24 text-primary-500" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg">
                        {cluster.id.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          {cluster.id}
                        </h3>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                          Cluster ID
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-6">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">
                          Farms
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {cluster.farmCount}
                        </p>
                      </div>
                      <div className="w-px bg-slate-100 dark:bg-slate-800 h-10"></div>
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase">
                          Livestock
                        </p>
                        <p className="text-xl font-bold text-slate-900 dark:text-white">
                          {cluster.cowCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center text-primary-600 text-sm font-bold group-hover:translate-x-1 transition-transform">
                      View Analytics <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredClusters.length === 0 && (
              <div className="col-span-full text-center py-12 text-slate-500">
                No clusters found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dashboard for Selected Cluster */}
      {selectedCluster && clusterStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Cluster Hero Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-slate-900 text-white border-none shadow-xl md:col-span-2">
              <CardContent className="p-8 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center gap-2 text-primary-200 mb-1">
                    <Layers className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      Active Cluster
                    </span>
                  </div>
                  <h2 className="text-4xl font-bold">{selectedCluster}</h2>
                </div>
                <div className="flex gap-8 mt-8">
                  <div>
                    <p className="text-sm text-slate-400">Total Farms</p>
                    <p className="text-2xl font-bold">
                      {clusterStats.farmCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Cows</p>
                    <p className="text-2xl font-bold">
                      {clusterStats.cowCount}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
              <CardContent className="p-6 flex flex-col justify-center h-full text-center">
                <div className="bg-white/20 p-3 rounded-full w-fit mx-auto mb-4">
                  <Activity className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold">{clusterStats.avgYield} L</p>
                <p className="text-blue-100 text-sm font-medium">
                  Avg Daily Milk / Farm
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
              <CardContent className="p-6 flex flex-col justify-center h-full text-center">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full w-fit mx-auto mb-4 text-slate-600 dark:text-slate-300">
                  <Target className="h-6 w-6" />
                </div>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {clusterStats.avgInsemDays}
                </p>
                <p className="text-slate-500 text-sm font-medium">
                  Avg Days to Insem.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* KPIs Table */}
          <Card className="overflow-hidden border-t-4 border-t-primary-500 shadow-md">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-600" />
                Performance Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left min-w-[600px]">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-4 md:px-6 py-4 font-semibold w-1/2">
                        Indicator
                      </th>
                      <th className="px-4 md:px-6 py-4 font-semibold">
                        Cluster Average
                      </th>
                      <th className="px-4 md:px-6 py-4 font-semibold text-right">
                        Assessment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        Insemination after calving (days)
                      </td>
                      <td className="px-4 md:px-6 py-4 font-bold">
                        {clusterStats.avgInsemDays}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end">
                        {renderTrend(
                          Number(clusterStats.avgInsemDays),
                          80,
                          true
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        Average Calving interval (months)
                      </td>
                      <td className="px-4 md:px-6 py-4 font-bold">
                        {clusterStats.avgCalvingInterval}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end">
                        {renderTrend(
                          Number(clusterStats.avgCalvingInterval),
                          14,
                          true
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        Heat after calving (days)
                      </td>
                      <td className="px-4 md:px-6 py-4 font-bold">
                        {clusterStats.avgHeatDays}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end">
                        {renderTrend(
                          Number(clusterStats.avgHeatDays),
                          60,
                          true
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        No. of inseminations per conception
                      </td>
                      <td className="px-4 md:px-6 py-4 font-bold">
                        {clusterStats.insemPerConception}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end">
                        {renderTrend(
                          Number(clusterStats.insemPerConception),
                          2.5,
                          true
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        Rate of repeat breeders (%)
                      </td>
                      <td className="px-4 md:px-6 py-4 font-bold">
                        {clusterStats.repeatBreederRate}%
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end">
                        {renderTrend(
                          Number(clusterStats.repeatBreederRate),
                          15,
                          true
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 md:px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                        Non-pregnant cows 3 month after calving (%)
                      </td>
                      <td className="px-4 md:px-6 py-4 font-bold">
                        {clusterStats.nonPreg90DayRate}%
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right flex justify-end">
                        {renderTrend(
                          Number(clusterStats.nonPreg90DayRate),
                          20,
                          true
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
