import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FarmService,
  CowService,
  DataService,
  StaffService,
} from "../services/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageLoader,
  Button,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
  Select,
  Label,
  Input,
} from "../components/ui";
import { ViewAssessmentModal } from "../components/ViewAssessmentModal";
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Droplets,
  Home,
  TrendingUp,
  Wheat,
  LayoutGrid,
  ShieldCheck,
  HeartPulse,
  Stethoscope,
  Users,
  Edit2,
  CheckCircle2,
  Activity,
  Syringe,
  AlertTriangle,
  ClipboardList,
  Pill,
  Eye,
  Navigation,
  Layers,
  Tent,
  Map,
  Search,
  X,
  ExternalLink,
  Copy,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { StaffMember, MedicalAssessment } from "../types";
import { useToast } from "../context/ToastContext";

// --- Components for Charts ---

const MilkTrendChart = ({ currentDaily }: { currentDaily: number }) => {
  const data = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const variance = Math.random() * 20 - 10;
      return Math.max(0, currentDaily + variance);
    });
  }, [currentDaily]);

  const max = Math.max(...data) * 1.1;
  const min = Math.min(...data) * 0.9;
  const range = max - min;
  const width = 100;
  const height = 40;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="w-full h-40 relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="milkGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`M0,${height} ${points} L${width},${height} Z`}
          fill="url(#milkGradient)"
        />
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] text-slate-400 mt-2">
        <span>30 Days Ago</span>
        <span>Today</span>
      </div>
    </div>
  );
};

const HygieneGauge = ({ score }: { score: number }) => {
  const percentage = (score / 4) * 100;
  const color =
    score >= 3
      ? "text-emerald-500"
      : score === 2
      ? "text-amber-500"
      : "text-red-500";
  const label =
    score === 4
      ? "Excellent"
      : score === 3
      ? "Good"
      : score === 2
      ? "Fair"
      : "Poor";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth="10"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="10"
            strokeDasharray={`${percentage * 2.51} 251.2`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${color}`}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          {label}
        </p>
        <p className="text-xs text-slate-500">Hygiene Score</p>
      </div>
    </div>
  );
};

const HealthDistributionChart = ({
  infectious,
  nonInfectious,
  healthy,
  total,
}: {
  infectious: number;
  nonInfectious: number;
  healthy: number;
  total: number;
}) => {
  if (total === 0) return <div className="text-xs text-slate-400">No data</div>;

  const infPct = (infectious / total) * 100;
  const nonInfPct = (nonInfectious / total) * 100;
  const healthyPct = (healthy / total) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex">
        {infPct > 0 && (
          <div style={{ width: `${infPct}%` }} className="h-full bg-rose-500" />
        )}
        {nonInfPct > 0 && (
          <div
            style={{ width: `${nonInfPct}%` }}
            className="h-full bg-amber-500"
          />
        )}
        {healthyPct > 0 && (
          <div
            style={{ width: `${healthyPct}%` }}
            className="h-full bg-emerald-500"
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-rose-500" /> Infectious (
          {infectious})
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" /> Non-Inf. (
          {nonInfectious})
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Healthy (
          {healthy})
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

// --- Main Component ---

export default function FarmDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // State for Modals & Search
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffModalType, setStaffModalType] = useState<
    "doctor" | "inseminator" | null
  >(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | string>("");
  const [staffSearchTerm, setStaffSearchTerm] = useState("");

  // State for Tab-specific Searches
  const [cowSearchTerm, setCowSearchTerm] = useState("");
  const [medicalSearchTerm, setMedicalSearchTerm] = useState("");

  const [selectedRecord, setSelectedRecord] =
    useState<MedicalAssessment | null>(null);

  // State for Cows Pagination
  const [cowsPage, setCowsPage] = useState(1);
  const cowsPerPage = 10;

  // Reset pagination when search changes
  useEffect(() => {
    setCowsPage(1);
  }, [cowSearchTerm]);

  // Queries
  const { data: farm, isLoading: farmLoading } = useQuery({
    queryKey: ["farm", id],
    queryFn: () => FarmService.getOne(id!),
    enabled: !!id,
  });

  const { data: allCows } = useQuery({
    queryKey: ["cows", id],
    queryFn: CowService.getAll,
    select: (allCows) =>
      allCows.filter((c) => {
        const targetId = String(id);
        // Check direct farm field (string or number)
        if (String(c.farm) === targetId) return true;

        // Check if farm is object
        if (typeof c.farm === "object") {
          if (String((c.farm as any).farm_id) === targetId) return true;
          if (String((c.farm as any).id) === targetId) return true;
        }

        // Check if cow has a flattened farm_id field (as seen in API response)
        if ((c as any).farm_id && String((c as any).farm_id) === targetId)
          return true;

        return false;
      }),
  });

  // Filter and Pagination Logic for Cows Tab
  const filteredCowsList = useMemo(() => {
    if (!allCows) return [];
    if (!cowSearchTerm) return allCows;
    const term = cowSearchTerm.toLowerCase();
    return allCows.filter((c) => c.cow_id.toLowerCase().includes(term));
  }, [allCows, cowSearchTerm]);

  const totalCows = filteredCowsList.length;
  const totalCowsPages = Math.ceil(totalCows / cowsPerPage);
  const startCowsIndex = (cowsPage - 1) * cowsPerPage;
  const endCowsIndex = startCowsIndex + cowsPerPage;
  const paginatedCows = filteredCowsList.slice(startCowsIndex, endCowsIndex);

  const { data: medicalRecords } = useQuery({
    queryKey: ["medical", id],
    queryFn: () => FarmService.getMedicalAssessments(id!),
    enabled: !!id,
  });

  // Filter Logic for Medical Records
  const filteredMedicalRecords = useMemo(() => {
    if (!medicalRecords) return [];
    if (!medicalSearchTerm) return medicalRecords;
    const term = medicalSearchTerm.toLowerCase();
    return medicalRecords.filter((r) => {
      const cowId = typeof r.cow === "string" ? r.cow : (r.cow as any).cow_id;
      const diagnosis = r.diagnosis || "";
      const notes = r.notes || "";
      return (
        cowId.toLowerCase().includes(term) ||
        diagnosis.toLowerCase().includes(term) ||
        notes.toLowerCase().includes(term)
      );
    });
  }, [medicalRecords, medicalSearchTerm]);

  const { data: housingTypes } = useQuery({
    queryKey: ["housing"],
    queryFn: DataService.getHousingTypes,
  });
  const { data: floorTypes } = useQuery({
    queryKey: ["floors"],
    queryFn: DataService.getFloorTypes,
  });

  // Staff Queries
  const { data: doctors, isLoading: doctorsLoading } = useQuery({
    queryKey: ["doctors"],
    queryFn: StaffService.getDoctors,
  });
  const { data: inseminators, isLoading: inseminatorsLoading } = useQuery({
    queryKey: ["inseminators"],
    queryFn: StaffService.getInseminators,
  });

  // --- Performance Metrics Calculations ---
  const performanceMetrics = useMemo(() => {
    if (!allCows || allCows.length === 0) return null;

    let totalInsemDays = 0;
    let insemCount = 0;
    let totalInsemPerConception = 0;
    let pregnantCount = 0;
    let repeatBreeders = 0;
    let inseminatedCowsCount = 0;
    let nonPregnant90Days = 0;
    let cowsPost90Days = 0;

    const now = new Date();

    allCows.forEach((cow) => {
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

    // Mocking metrics that require extensive historical data not in basic Cow model
    const avgCalvingInterval = 13.5; // Months
    const heatAfterCalving = 45.2; // Days

    return {
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
  }, [allCows]);

  // Reset search when modal opens
  useEffect(() => {
    if (isStaffModalOpen) {
      setStaffSearchTerm("");
    }
  }, [isStaffModalOpen]);

  // Filter Staff Logic
  const filteredStaff = useMemo(() => {
    const list = staffModalType === "doctor" ? doctors : inseminators;
    if (!list) return [];
    if (!staffSearchTerm) return list;
    const term = staffSearchTerm.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.phone_number.includes(term) ||
        (s.license_number && s.license_number.toLowerCase().includes(term))
    );
  }, [staffModalType, doctors, inseminators, staffSearchTerm]);

  // Mutations
  const changeStaffMutation = useMutation({
    mutationFn: async ({
      type,
      staffId,
    }: {
      type: "doctor" | "inseminator";
      staffId: number;
    }) => {
      if (type === "doctor") {
        return FarmService.changeDoctor(id!, staffId);
      } else {
        return FarmService.changeInseminator(id!, staffId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["farm", id] });
      setIsStaffModalOpen(false);
      setSelectedStaffId("");
      toast({
        type: "success",
        title: "Staff Assigned Successfully",
        message: `The ${variables.type} has been updated for this farm.`,
      });
    },
    onError: () => {
      toast({
        type: "error",
        title: "Assignment Failed",
        message: "Could not update staff assignment. Please try again.",
      });
    },
  });

  const handleStaffUpdate = () => {
    if (!staffModalType || !selectedStaffId) return;
    changeStaffMutation.mutate({
      type: staffModalType,
      staffId: Number(selectedStaffId),
    });
  };

  const openStaffModal = (type: "doctor" | "inseminator") => {
    setStaffModalType(type);
    // Pre-select current if available
    if (type === "doctor") {
      const currentId =
        typeof farm?.doctor === "object" ? farm.doctor?.id : farm?.doctor;
      if (currentId) setSelectedStaffId(currentId);
    } else {
      const currentId =
        typeof farm?.inseminator === "object"
          ? farm.inseminator?.id
          : farm?.inseminator;
      if (currentId) setSelectedStaffId(currentId);
    }
    setIsStaffModalOpen(true);
  };

  const handleCopyId = () => {
    if (farm?.farm_id) {
      navigator.clipboard.writeText(farm.farm_id);
      toast({
        type: "info",
        title: "ID Copied",
        message: `Farm ID ${farm.farm_id} copied to clipboard.`,
        duration: 2000,
      });
    }
  };

  // Parse GPS from Kobo (space separated) or Standard (comma separated)
  const parseGPS = (gpsString?: string) => {
    if (!gpsString) return null;
    // Kobo/ODK: "lat lon alt acc"
    const koboParts = gpsString.trim().split(" ");
    if (koboParts.length >= 2 && !gpsString.includes(",")) {
      return {
        lat: koboParts[0],
        lon: koboParts[1],
        display: `${parseFloat(koboParts[0]).toFixed(5)}, ${parseFloat(
          koboParts[1]
        ).toFixed(5)}`,
      };
    }
    // Standard: "lat, lon"
    const commaParts = gpsString.split(",");
    if (commaParts.length === 2) {
      return {
        lat: commaParts[0].trim(),
        lon: commaParts[1].trim(),
        display: gpsString,
      };
    }
    return null;
  };

  const gpsData = useMemo(
    () => parseGPS(farm?.location_gps),
    [farm?.location_gps]
  );

  // Resolve Data Helpers
  const assignedDoctor = useMemo(() => {
    if (!farm || !farm.doctor) return null;
    if (typeof farm.doctor === "object") return farm.doctor as StaffMember;
    return doctors?.find((d) => d.id === farm.doctor);
  }, [farm?.doctor, doctors]);

  const assignedInseminator = useMemo(() => {
    if (!farm || !farm.inseminator) return null;
    if (typeof farm.inseminator === "object")
      return farm.inseminator as StaffMember;
    return inseminators?.find((i) => i.id === farm.inseminator);
  }, [farm?.inseminator, inseminators]);

  // Medical Stats
  const medicalStats = useMemo(() => {
    if (!medicalRecords)
      return {
        total: 0,
        sick: 0,
        vaccinated: 0,
        dewormed: 0,
        infectious: 0,
        nonInfectious: 0,
        healthy: 0,
      };

    const total = medicalRecords.length;
    const sick = medicalRecords.filter((r) => r.is_cow_sick).length;
    const infectious = medicalRecords.filter(
      (r) => r.sickness_type === "infectious"
    ).length;
    const nonInfectious = sick - infectious;
    const healthy = total - sick;

    return {
      total,
      sick,
      vaccinated: medicalRecords.filter((r) => r.is_cow_vaccinated).length,
      dewormed: medicalRecords.filter((r) => r.has_deworming).length,
      infectious,
      nonInfectious,
      healthy,
    };
  }, [medicalRecords]);

  if (farmLoading) return <PageLoader variant="inline" />;
  if (!farm)
    return <div className="p-8 text-center text-slate-500">Farm not found</div>;

  const housingName =
    typeof farm.type_of_housing === "number"
      ? housingTypes?.find((h) => h.id === farm.type_of_housing)?.name
      : (farm.type_of_housing as any)?.name;

  const floorName =
    typeof farm.type_of_floor === "number"
      ? floorTypes?.find((f) => f.id === farm.type_of_floor)?.name
      : (farm.type_of_floor as any)?.name;

  // Helper for trend icon
  const renderTrend = (val: number, target: number, inverse = false) => {
    const isGood = inverse ? val <= target : val >= target;
    return isGood ? (
      <div className="flex items-center text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
        <ArrowUpRight className="h-3 w-3 mr-1" /> Good
      </div>
    ) : (
      <div className="flex items-center text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full text-xs font-medium">
        <ArrowDownRight className="h-3 w-3 mr-1" /> Check
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Cinematic Hero Section */}
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-0"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl -mr-20 -mt-20 z-0"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 z-0"></div>

        <div className="relative z-10 p-8 md:p-10">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/farms")}
                className="text-slate-400 hover:text-white hover:bg-white/10 -ml-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to Registry
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  {farm.owner_name}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-slate-400">
                  <Badge className="bg-primary-500/20 text-primary-200 border-primary-500/30 px-3 py-1 flex items-center gap-2">
                    ID: {farm.farm_id}
                    <button onClick={handleCopyId} className="hover:text-white">
                      <Copy className="h-3 w-3" />
                    </button>
                  </Badge>
                  <span className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4" /> {farm.address}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">
                  <Home className="h-4 w-4" /> Total Herd
                </div>
                <div className="text-3xl font-bold">
                  {farm.total_number_of_cows}
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 min-w-[140px]">
                <div className="flex items-center gap-2 text-emerald-400 text-xs uppercase font-bold tracking-wider mb-1">
                  <Droplets className="h-4 w-4" /> Daily Milk
                </div>
                <div className="text-3xl font-bold">
                  {farm.total_daily_milk}{" "}
                  <span className="text-lg font-normal text-slate-400">L</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs>
        <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("overview")}
              className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "overview"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" /> Overview
              </div>
            </button>
            <button
              onClick={() => setActiveTab("cows")}
              className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "cows"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" /> Cows
              </div>
            </button>
            <button
              onClick={() => setActiveTab("medical")}
              className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "medical"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <HeartPulse className="h-4 w-4" /> Medical History
              </div>
            </button>
            <button
              onClick={() => setActiveTab("performance")}
              className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "performance"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Performance
              </div>
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                activeTab === "staff"
                  ? "border-primary-500 text-primary-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Staff
              </div>
            </button>
          </div>
        </div>

        {/* OVERVIEW TAB - Layout Optimized */}
        <TabsContent active={activeTab === "overview"}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN (Sidebar - Operational & Infra) */}
            <div className="space-y-6">
              <Card className="border-t-4 border-t-primary-500 shadow-sm overflow-hidden">
                <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-800/50">
                  <CardTitle className="text-sm uppercase text-slate-500 font-bold tracking-wider">
                    Operational Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Owner</p>
                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                        {farm.owner_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full">
                      <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Contact Number</p>
                      <p className="font-medium text-sm text-slate-900 dark:text-white font-mono">
                        {farm.telephone_number}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Address</p>
                      <p className="font-medium text-sm text-slate-900 dark:text-white leading-tight">
                        {farm.address}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                      <Navigation className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-400">
                          Field Coordinates (GPS)
                        </p>
                        {gpsData && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${gpsData.lat},${gpsData.lon}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] text-primary-600 hover:underline flex items-center gap-1"
                          >
                            View Map <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <p className="font-mono text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-block mt-1 text-slate-600 dark:text-slate-300">
                        {gpsData
                          ? gpsData.display
                          : farm.location_gps || "Not Set"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        Cluster
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Layers className="h-3 w-3 text-slate-400" />
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          {farm.cluster_number || "-"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">
                        Fert. Camp
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Tent className="h-3 w-3 text-slate-400" />
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          #{farm.fertility_camp_no}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase text-slate-500">
                    Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        Housing
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {housingName || "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                      <LayoutGrid className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">
                        Flooring
                      </p>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {floorName || "Unknown"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT COLUMN (Dynamic Content) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Milk Trend */}
              <Card className="h-auto">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-500" />{" "}
                      Production Metrics
                    </CardTitle>
                    <Badge variant="info">Last 30 Days</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mt-2">
                    <MilkTrendChart currentDaily={farm.total_daily_milk} />
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        Avg Yield / Cow
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {(
                          farm.total_daily_milk /
                          (farm.number_of_milking_cows || 1)
                        ).toFixed(1)}{" "}
                        L
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        Milking Efficiency
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        {Math.round(
                          (farm.number_of_milking_cows /
                            farm.total_number_of_cows) *
                            100
                        )}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        Hygiene
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1">
                        {farm.farm_hygiene_score}/4{" "}
                        <span className="text-[10px] text-slate-400 font-normal uppercase">
                          Score
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase text-slate-500">
                      Herd Composition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>{" "}
                          Milking
                        </span>
                        <span>{farm.number_of_milking_cows}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${
                              (farm.number_of_milking_cows /
                                farm.total_number_of_cows) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
                          Dry
                        </span>
                        <span>
                          {farm.total_number_of_cows -
                            farm.number_of_milking_cows -
                            farm.number_of_calves}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${
                              ((farm.total_number_of_cows -
                                farm.number_of_milking_cows -
                                farm.number_of_calves) /
                                farm.total_number_of_cows) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500"></div>{" "}
                          Calves
                        </span>
                        <span>{farm.number_of_calves}</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500"
                          style={{
                            width: `${
                              (farm.number_of_calves /
                                farm.total_number_of_cows) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm uppercase text-slate-500">
                      Feed & Water
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Wheat className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">
                          Main Feed
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {farm.main_feed}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                        <Droplets className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-400 font-medium">
                          Water Source
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {typeof farm.source_of_water === "object"
                            ? farm.source_of_water.name
                            : farm.source_of_water}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <span className="text-xs text-slate-400">
                        Hygiene Score
                      </span>
                      <HygieneGauge score={farm.farm_hygiene_score} />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* COWS TAB */}
        <TabsContent active={activeTab === "cows"}>
          <div className="mt-6">
            <Card>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>Registered Cows</CardTitle>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by Cow ID..."
                      className="pl-10 h-10 bg-slate-50 dark:bg-slate-900"
                      value={cowSearchTerm}
                      onChange={(e) => setCowSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button size="sm" onClick={() => navigate("/cows")}>
                    Go to Registry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Cow ID</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Production</th>
                        <th className="px-6 py-4 font-semibold">Lactation #</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedCows.length > 0 ? (
                        paginatedCows.map((cow) => (
                          <tr
                            key={cow.cow_id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-primary-600">
                              {cow.cow_id}
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant={
                                  cow.status === "Sick"
                                    ? "danger"
                                    : cow.status === "Pregnant"
                                    ? "warning"
                                    : "success"
                                }
                              >
                                {cow.status}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {cow.average_daily_milk} L/day
                            </td>
                            <td className="px-6 py-4">
                              {cow.lactation_number}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate(`/cows/${cow.cow_id}`)}
                              >
                                Details
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-8 text-center text-slate-500"
                          >
                            No cows found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Cows Pagination */}
                {totalCows > 0 && (
                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-500">
                      Showing {startCowsIndex + 1}-
                      {Math.min(endCowsIndex, totalCows)} of {totalCows}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCowsPage((p) => Math.max(1, p - 1))}
                        disabled={cowsPage === 1}
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCowsPage((p) => Math.min(totalCowsPages, p + 1))
                        }
                        disabled={cowsPage === totalCowsPages}
                        className="h-8 px-2"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MEDICAL TAB */}
        <TabsContent active={activeTab === "medical"}>
          <div className="mt-4 space-y-6">
            {/* Health Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-1">
                      <AlertTriangle className="h-5 w-5 text-rose-500" />
                      <span className="text-sm font-medium text-rose-700 dark:text-rose-400">
                        Sick Cows
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-rose-900 dark:text-rose-100">
                      {medicalStats.sick}
                    </p>
                    <div className="mt-4">
                      <p className="text-xs text-slate-500 mb-1">
                        Sickness Distribution
                      </p>
                      <HealthDistributionChart
                        infectious={medicalStats.infectious}
                        nonInfectious={medicalStats.nonInfectious}
                        healthy={medicalStats.healthy}
                        total={medicalStats.total}
                      />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 flex flex-col justify-between h-full">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <Syringe className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          Vaccinated
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {medicalStats.vaccinated}
                      </p>
                      <p className="text-xs text-slate-500">
                        of {medicalStats.total} assessments
                      </p>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                      <div
                        className="bg-blue-500 h-full"
                        style={{
                          width: `${
                            (medicalStats.vaccinated /
                              (medicalStats.total || 1)) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Pill className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Dewormed</p>
                        <p className="text-xl font-bold">
                          {medicalStats.dewormed}
                        </p>
                      </div>
                    </div>
                    <div className="h-10 w-10 relative">
                      <svg
                        className="h-full w-full transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          className="text-slate-100"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="text-emerald-500"
                          strokeDasharray={`${
                            (medicalStats.dewormed /
                              (medicalStats.total || 1)) *
                            100
                          }, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Records</p>
                        <p className="text-xl font-bold">
                          {medicalStats.total}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Assessments Table */}
            <Card>
              <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <CardTitle>Assessment Records</CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search by Cow ID or Diagnosis..."
                    className="pl-10 h-10 bg-slate-50 dark:bg-slate-900"
                    value={medicalSearchTerm}
                    onChange={(e) => setMedicalSearchTerm(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Date</th>
                        <th className="px-6 py-4 font-semibold">Cow ID</th>
                        <th className="px-6 py-4 font-semibold">Assessed By</th>
                        <th className="px-6 py-4 font-semibold">
                          Health Status
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Diagnosis / Notes
                        </th>
                        <th className="px-6 py-4 font-semibold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredMedicalRecords &&
                      filteredMedicalRecords.length > 0 ? (
                        filteredMedicalRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                              {new Date(
                                record.assessment_date
                              ).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-medium">
                              {typeof record.cow === "string"
                                ? record.cow
                                : (record.cow as any).cow_id ||
                                  (record.cow as any).id ||
                                  "Unknown"}
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              {typeof record.assessed_by === "number"
                                ? doctors?.find(
                                    (d) => d.id === record.assessed_by
                                  )?.name || `ID: ${record.assessed_by}`
                                : (record.assessed_by as StaffMember).name}
                            </td>
                            <td className="px-6 py-4">
                              {record.is_cow_sick ? (
                                <Badge variant="danger">Sick</Badge>
                              ) : (
                                <Badge variant="success">Healthy</Badge>
                              )}
                              {record.sickness_type === "infectious" && (
                                <span className="ml-2 text-xs text-rose-500 font-medium border border-rose-200 bg-rose-50 px-1.5 py-0.5 rounded">
                                  Infectious
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs truncate">
                                {record.diagnosis || record.notes || (
                                  <span className="text-slate-400 italic">
                                    No specific notes
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRecord(record)}
                              >
                                <Eye className="h-4 w-4 mr-2" /> View
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-8 text-center text-slate-500"
                          >
                            No medical assessments found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* PERFORMANCE TAB */}
        <TabsContent active={activeTab === "performance"}>
          <div className="mt-6 space-y-8">
            {/* Farm Performance Indicators */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                      Farm Performance Indicators
                    </CardTitle>
                    <p className="text-sm text-slate-500 mt-1">
                      Key reproduction and production metrics for{" "}
                      {farm.owner_name}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-1/2">
                          Indicator
                        </th>
                        <th className="px-6 py-4 font-semibold">Value</th>
                        <th className="px-6 py-4 font-semibold text-right">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {performanceMetrics ? (
                        <>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              Insemination after calving (days)
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {performanceMetrics.avgInsemDays}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {renderTrend(
                                Number(performanceMetrics.avgInsemDays),
                                80,
                                true
                              )}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              Average Calving interval (months)
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {performanceMetrics.avgCalvingInterval}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {renderTrend(
                                Number(performanceMetrics.avgCalvingInterval),
                                14,
                                true
                              )}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              Heat after calving (days)
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {performanceMetrics.avgHeatDays}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {renderTrend(
                                Number(performanceMetrics.avgHeatDays),
                                60,
                                true
                              )}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              No. of inseminations per conception
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {performanceMetrics.insemPerConception}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {renderTrend(
                                Number(performanceMetrics.insemPerConception),
                                2.5,
                                true
                              )}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              Rate of repeat breeders (%)
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {performanceMetrics.repeatBreederRate}%
                            </td>
                            <td className="px-6 py-4 text-right">
                              {renderTrend(
                                Number(performanceMetrics.repeatBreederRate),
                                15,
                                true
                              )}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                              Non-pregnant cows 3 month after calving (%)
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {performanceMetrics.nonPreg90DayRate}%
                            </td>
                            <td className="px-6 py-4 text-right">
                              {renderTrend(
                                Number(performanceMetrics.nonPreg90DayRate),
                                20,
                                true
                              )}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-6 text-center text-slate-500"
                          >
                            Insufficient data to calculate metrics.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Cluster Performance Indicators */}
            <Card className="border-l-4 border-l-purple-500 opacity-90">
              <CardHeader className="pb-4 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
                        Cluster Performance
                      </CardTitle>
                      <Badge
                        variant="default"
                        className="bg-purple-100 text-purple-700 border-purple-200"
                      >
                        Benchmark
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      Aggregate metrics for Cluster:{" "}
                      {farm.cluster_number || "Unknown"}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Target className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-1/2">
                          Indicator
                        </th>
                        <th className="px-6 py-4 font-semibold">
                          Cluster Avg.
                        </th>
                        <th className="px-6 py-4 font-semibold text-right">
                          Comparison
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {/* Simulated Cluster Data for Demo */}
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          Insemination after calving (days)
                        </td>
                        <td className="px-6 py-4 font-bold">75.0</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-400 flex items-center justify-end gap-1">
                            <Minus className="h-3 w-3" /> Avg
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          Average Calving interval (months)
                        </td>
                        <td className="px-6 py-4 font-bold">14.2</td>
                        <td className="px-6 py-4 text-right text-emerald-600 text-xs font-bold">
                          Better
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          Heat after calving (days)
                        </td>
                        <td className="px-6 py-4 font-bold">50.5</td>
                        <td className="px-6 py-4 text-right text-emerald-600 text-xs font-bold">
                          Better
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          No. of inseminations per conception
                        </td>
                        <td className="px-6 py-4 font-bold">1.8</td>
                        <td className="px-6 py-4 text-right text-rose-500 text-xs font-bold">
                          Lower
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          Rate of repeat breeders (%)
                        </td>
                        <td className="px-6 py-4 font-bold">12.5%</td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-xs text-slate-400 flex items-center justify-end gap-1">
                            <Minus className="h-3 w-3" /> Avg
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                          Non-pregnant cows 3 month after calving (%)
                        </td>
                        <td className="px-6 py-4 font-bold">25.0%</td>
                        <td className="px-6 py-4 text-right text-emerald-600 text-xs font-bold">
                          Better
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* STAFF TAB */}
        <TabsContent active={activeTab === "staff"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Doctor Card */}
            <Card className="border-l-4 border-l-blue-500 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                      <Stethoscope className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Assigned Doctor
                      </h3>
                      <Badge variant="info" className="mt-1">
                        Veterinarian
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStaffModal("doctor")}
                  >
                    <Edit2 className="h-4 w-4 mr-2" /> Change
                  </Button>
                </div>

                <div className="space-y-4">
                  {doctorsLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ) : assignedDoctor ? (
                    <>
                      <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800 items-center">
                        <span className="text-slate-500">Name</span>
                        <span className="font-medium text-lg">
                          {assignedDoctor.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800 items-center">
                        <span className="text-slate-500">License</span>
                        <span className="font-medium font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                          {assignedDoctor.license_number || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800 items-center">
                        <span className="text-slate-500">Specialization</span>
                        <span className="font-medium">
                          {assignedDoctor.specialization || "General"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 items-center">
                        <span className="text-slate-500">Phone</span>
                        <span className="font-medium">
                          {assignedDoctor.phone_number}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {farm.doctor
                          ? `Unknown (ID: ${farm.doctor})`
                          : "No doctor assigned."}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-blue-600 mt-2"
                        onClick={() => openStaffModal("doctor")}
                      >
                        Assign Now
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Inseminator Card */}
            <Card className="border-l-4 border-l-purple-500 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        Inseminator
                      </h3>
                      <Badge
                        variant="default"
                        className="mt-1 bg-purple-100 text-purple-700 border-purple-200"
                      >
                        Specialist
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openStaffModal("inseminator")}
                  >
                    <Edit2 className="h-4 w-4 mr-2" /> Change
                  </Button>
                </div>

                <div className="space-y-4">
                  {inseminatorsLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                    </div>
                  ) : assignedInseminator ? (
                    <>
                      <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800 items-center">
                        <span className="text-slate-500">Name</span>
                        <span className="font-medium text-lg">
                          {assignedInseminator.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-3 border-b border-slate-50 dark:border-slate-800 items-center">
                        <span className="text-slate-500">Address</span>
                        <span className="font-medium">
                          {assignedInseminator.address || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 items-center">
                        <span className="text-slate-500">Phone</span>
                        <span className="font-medium">
                          {assignedInseminator.phone_number}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>
                        {farm.inseminator
                          ? `Unknown (ID: ${farm.inseminator})`
                          : "No inseminator assigned."}
                      </p>
                      <Button
                        variant="ghost"
                        className="text-purple-600 mt-2"
                        onClick={() => openStaffModal("inseminator")}
                      >
                        Assign Now
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* STAFF ASSIGNMENT MODAL - Redesigned */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title={`Assign ${
          staffModalType === "doctor" ? "Doctor" : "Inseminator"
        }`}
        className="max-w-xl"
      >
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={`Search ${
                staffModalType === "doctor" ? "Doctors" : "Inseminators"
              } by name or phone...`}
              className="pl-10 h-11"
              value={staffSearchTerm}
              onChange={(e) => setStaffSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {filteredStaff.length > 0 ? (
              filteredStaff.map((staff) => (
                <div
                  key={staff.id}
                  onClick={() => setSelectedStaffId(staff.id)}
                  className={`group p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 relative ${
                    Number(selectedStaffId) === staff.id
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500"
                      : "border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-slate-600 bg-white dark:bg-slate-950"
                  }`}
                >
                  <div
                    className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                      Number(selectedStaffId) === staff.id
                        ? "bg-primary-200 text-primary-700"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {staffModalType === "doctor" ? (
                      <Stethoscope className="h-6 w-6" />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base">
                        {staff.name}
                      </h4>
                      {Number(selectedStaffId) === staff.id && (
                        <CheckCircle2 className="h-5 w-5 text-primary-600 fill-primary-100" />
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {staffModalType === "doctor"
                        ? staff.specialization || "General Vet"
                        : staff.address || "N/A"}
                    </p>
                    <p className="text-xs text-slate-400 mt-2 font-mono bg-slate-50 dark:bg-slate-800 w-fit px-2 py-0.5 rounded">
                      {staff.phone_number}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Search className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-900 dark:text-white font-medium">
                  No staff found
                </p>
                <p className="text-slate-500 text-sm">
                  Try adjusting your search term.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setIsStaffModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStaffUpdate}
              disabled={!selectedStaffId || changeStaffMutation.isPending}
              isLoading={changeStaffMutation.isPending}
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900"
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>

      {/* VIEW ASSESSMENT MODAL */}
      <ViewAssessmentModal
        assessment={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
