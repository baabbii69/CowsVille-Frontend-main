import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CowService, DataService } from "../services/api";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PageLoader,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Modal,
} from "../components/ui";
import { ViewAssessmentModal } from "../components/ViewAssessmentModal";
import {
  ArrowLeft,
  Activity,
  Milk,
  Heart,
  Calendar,
  Scale,
  Clock,
  Syringe,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Stethoscope,
  Info,
  Home,
  Zap,
  Thermometer,
  TrendingUp,
  Timer,
  Flame,
} from "lucide-react";
import { MedicalAssessment, StaffMember } from "../types";
import { useToast } from "../context/ToastContext";

// --- Fertility Window Component ---
const FertilityWindowGraph = ({
  heatStartTime,
}: {
  heatStartTime?: string | Date;
}) => {
  // Mock start time if not provided (14 hours ago to show Green zone active)
  const start = useMemo(
    () =>
      heatStartTime
        ? new Date(heatStartTime)
        : new Date(Date.now() - 1000 * 60 * 60 * 14),
    [heatStartTime]
  );

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const elapsedHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
  const maxHours = 32; // Showing slightly more than 28 to give breathing room
  const graphHeight = 140;
  const graphWidth = 320;

  // Map relative hours to SVG X coordinate
  const scaleX = (h: number) => (h / maxHours) * graphWidth;
  const pointerX = Math.min(scaleX(elapsedHours), graphWidth);

  // Generate X-Axis Ticks (Every 4 hours from Start Time)
  const ticks = useMemo(() => {
    const t = [];
    for (let i = 0; i <= 28; i += 4) {
      const tickTime = new Date(start.getTime() + i * 60 * 60 * 1000);
      const isMidnightCross = tickTime.getHours() < 4 && i > 0; // Simple check for day change context

      t.push({
        hour: i,
        label: tickTime
          .toLocaleTimeString([], { hour: "numeric", hour12: true })
          .replace(" ", ""), // "6PM"
        day: isMidnightCross
          ? tickTime.toLocaleDateString([], { weekday: "short" })
          : null, // "Tue"
        fullTime: tickTime,
      });
    }
    return t;
  }, [start]);

  return (
    <div className="w-full space-y-4 bg-white dark:bg-slate-900 rounded-2xl p-2">
      <style>
        {`
                    @keyframes scan-light {
                        0% { transform: translateX(-100%); opacity: 0; }
                        50% { opacity: 0.5; }
                        100% { transform: translateX(100%); opacity: 0; }
                    }
                    .animate-scan {
                        animation: scan-light 4s ease-in-out infinite;
                    }
                    @keyframes dash {
                        to { stroke-dashoffset: 0; }
                    }
                    .animate-path {
                        stroke-dasharray: 1000;
                        stroke-dashoffset: 1000;
                        animation: dash 2s ease-out forwards;
                    }
                `}
      </style>
      <div className="flex justify-between items-end px-2">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Timer className="h-4 w-4 text-violet-500" /> Fertility Window
          </h4>
          <div className="text-xs text-slate-500 mt-1">
            Heat Onset:
            <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">
              {start.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <span className="mx-1">at</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {start.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Elapsed Time
          </p>
          <div className="flex items-baseline justify-end gap-1">
            <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 font-mono">
              {elapsedHours.toFixed(1)}
            </p>
            <span className="text-sm font-medium text-slate-500">hrs</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[2.5/1] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox={`0 0 ${graphWidth} ${graphHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Vibrancy Gradients */}
            <linearGradient id="zoneRed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="zoneYellow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="zoneGreen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.1" />
            </linearGradient>

            {/* Scanning Shine Gradient */}
            <linearGradient id="scanGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.5" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* --- Grid & Axes --- */}
          {/* Horizontal Lines */}
          {[0.25, 0.5, 0.75].map((y) => (
            <line
              key={y}
              x1="0"
              y1={graphHeight * y}
              x2={graphWidth}
              y2={graphHeight * y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}

          {/* X-Axis Absolute Time Markers */}
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={scaleX(tick.hour)}
                y1="0"
                x2={scaleX(tick.hour)}
                y2={graphHeight}
                stroke="#cbd5e1"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={scaleX(tick.hour)}
                y={graphHeight - 15}
                fontSize="9"
                fill="#64748b"
                fontWeight="600"
                textAnchor="middle"
              >
                {tick.label}
              </text>
              {tick.day && (
                <text
                  x={scaleX(tick.hour)}
                  y={graphHeight - 5}
                  fontSize="8"
                  fill="#94a3b8"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {tick.day}
                </text>
              )}
            </g>
          ))}

          {/* --- Probability Zones (Area Charts) mapped to Relative Hours --- */}

          {/* 0-6h: No Probability (Red) */}
          <path
            d={`M 0 ${graphHeight} L 0 ${graphHeight * 0.8} L ${scaleX(6)} ${
              graphHeight * 0.8
            } L ${scaleX(6)} ${graphHeight} Z`}
            fill="url(#zoneRed)"
            stroke="#fb7185"
            strokeWidth="2"
            className="animate-path"
          />

          {/* 6-9h: Low Probability (Yellow) */}
          <path
            d={`M ${scaleX(6)} ${graphHeight} L ${scaleX(6)} ${
              graphHeight * 0.6
            } L ${scaleX(9)} ${graphHeight * 0.6} L ${scaleX(
              9
            )} ${graphHeight} Z`}
            fill="url(#zoneYellow)"
            stroke="#fbbf24"
            strokeWidth="2"
            className="animate-path"
          />

          {/* 9-24h: High Probability (Green) */}
          <path
            d={`M ${scaleX(9)} ${graphHeight} L ${scaleX(9)} ${
              graphHeight * 0.15
            } L ${scaleX(24)} ${graphHeight * 0.15} L ${scaleX(
              24
            )} ${graphHeight} Z`}
            fill="url(#zoneGreen)"
            stroke="#34d399"
            strokeWidth="2"
            className="animate-path"
          />

          {/* 24-28h: Low Probability (Yellow) */}
          <path
            d={`M ${scaleX(24)} ${graphHeight} L ${scaleX(24)} ${
              graphHeight * 0.6
            } L ${scaleX(28)} ${graphHeight * 0.6} L ${scaleX(
              28
            )} ${graphHeight} Z`}
            fill="url(#zoneYellow)"
            stroke="#fbbf24"
            strokeWidth="2"
            className="animate-path"
          />

          {/* >28h: Cycle End (Red) */}
          <path
            d={`M ${scaleX(28)} ${graphHeight} L ${scaleX(28)} ${
              graphHeight * 0.8
            } L ${graphWidth} ${
              graphHeight * 0.8
            } L ${graphWidth} ${graphHeight} Z`}
            fill="url(#zoneRed)"
            stroke="#fb7185"
            strokeWidth="2"
            className="animate-path"
          />

          {/* Zone Labels */}
          <text
            x={scaleX(3)}
            y={graphHeight * 0.75}
            fontSize="8"
            fill="#e11d48"
            fontWeight="bold"
            textAnchor="middle"
            className="uppercase"
          >
            No Prob
          </text>
          <text
            x={scaleX(7.5)}
            y={graphHeight * 0.55}
            fontSize="8"
            fill="#d97706"
            fontWeight="bold"
            textAnchor="middle"
            className="uppercase"
          >
            Low
          </text>
          <text
            x={scaleX(16.5)}
            y={graphHeight * 0.12}
            fontSize="10"
            fill="#059669"
            fontWeight="bold"
            textAnchor="middle"
            className="uppercase tracking-widest"
          >
            Optimal Window
          </text>
          <text
            x={scaleX(26)}
            y={graphHeight * 0.55}
            fontSize="8"
            fill="#d97706"
            fontWeight="bold"
            textAnchor="middle"
            className="uppercase"
          >
            Low
          </text>

          {/* Scanning Overlay */}
          <rect
            x="0"
            y="0"
            width="60"
            height={graphHeight}
            fill="url(#scanGradient)"
            className="animate-scan mix-blend-overlay"
          />

          {/* --- Current Time Pointer --- */}
          <g
            transform={`translate(${pointerX}, 0)`}
            className="transition-transform duration-1000 ease-linear"
          >
            {/* Vertical Line */}
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={graphHeight}
              stroke="#4f46e5"
              strokeWidth="2"
              strokeDasharray="2 1"
            />

            {/* Pulsing Indicator */}
            <circle
              cx="0"
              cy={graphHeight * 0.5}
              r="8"
              className="fill-violet-500 animate-ping opacity-30"
            />
            <circle
              cx="0"
              cy={graphHeight * 0.5}
              r="4"
              className="fill-violet-600 stroke-white stroke-2"
            />

            {/* Label Box */}
            <g transform="translate(-18, -10)">
              <rect
                x="0"
                y="0"
                width="36"
                height="16"
                rx="4"
                className="fill-violet-600 shadow-md"
              />
              <text
                x="18"
                y="11"
                fontSize="9"
                fill="white"
                fontWeight="bold"
                textAnchor="middle"
              >
                NOW
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center mt-2">
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-50 rounded-full border border-rose-100">
          <div className="w-2 h-2 rounded-full bg-rose-500"></div>
          <span className="text-[10px] font-medium text-rose-700">
            No Probability
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-100">
          <div className="w-2 h-2 rounded-full bg-amber-500"></div>
          <span className="text-[10px] font-medium text-amber-700">
            Low Probability
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="text-[10px] font-bold text-emerald-700">
            High Probability
          </span>
        </div>
        ```
      </div>
    </div>
  );
};

// --- Main Component ---

const LactationCycleVisual = ({ daysInMilk }: { daysInMilk: number }) => {
  const standardLactation = 305;
  const percentage = Math.min((daysInMilk / standardLactation) * 100, 100);
  const isOverdue = daysInMilk > standardLactation;

  return (
    <div className="flex items-center gap-4 py-2">
      <div className="relative h-14 w-14 flex items-center justify-center shrink-0">
        <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-slate-100 dark:text-slate-800"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className={isOverdue ? "text-amber-500" : "text-violet-500"}
            strokeDasharray={`${percentage}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">
          {Math.round(percentage)}%
        </div>
      </div>
      <div>
        <p className="text-sm font-bold text-slate-900 dark:text-white">
          Lactation Phase
        </p>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-1.5 mb-1 overflow-hidden">
          <div
            className={`h-full rounded-full ${
              isOverdue ? "bg-amber-500" : "bg-violet-500"
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <p className="text-[10px] text-slate-500">
          {daysInMilk} days / {standardLactation} target
          {isOverdue && (
            <span className="text-amber-500 font-medium ml-1">(Late)</span>
          )}
        </p>
      </div>
    </div>
  );
};

const BCSGauge = ({ score }: { score: number }) => {
  let colorClass = "text-emerald-500";
  let label = "Optimal";

  if (score <= 2) {
    colorClass = "text-rose-500";
    label = "Very Thin";
  } else if (score < 2.75) {
    colorClass = "text-amber-500";
    label = "Thin";
  } else if (score > 4) {
    colorClass = "text-rose-500";
    label = "Obese";
  } else if (score > 3.5) {
    colorClass = "text-amber-500";
    label = "Fat";
  }

  const percentage = (score / 5) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-40 overflow-hidden">
        <svg className="h-full w-full" viewBox="0 0 100 55">
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 35 18"
            fill="none"
            stroke="currentColor"
            strokeWidth="0"
            className="text-rose-200 opacity-20"
          />
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000`}
            strokeDasharray={`${(percentage / 100) * 126}, 126`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className={`text-3xl font-bold ${colorClass}`}>{score}</span>
          <span className="text-xs text-slate-400 uppercase font-medium">
            BCS
          </span>
        </div>
      </div>
      <div
        className={`px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 ${colorClass.replace(
          "text-",
          "text-opacity-80 "
        )}`}
      >
        {label} Condition
      </div>
    </div>
  );
};

const HealthStatusIndicator = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  const isGood = ["Good", "Healthy", "Negative", "Normal"].includes(value);
  const isWarning = ["Fair", "Sub-clinical"].includes(value);

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-bold ${
            isGood
              ? "text-emerald-600"
              : isWarning
              ? "text-amber-500"
              : "text-rose-500"
          }`}
        >
          {value}
        </span>
        <div
          className={`w-2 h-2 rounded-full ${
            isGood
              ? "bg-emerald-500"
              : isWarning
              ? "bg-amber-500"
              : "bg-rose-500"
          }`}
        ></div>
      </div>
    </div>
  );
};

export default function CowDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timeline");
  const [selectedRecord, setSelectedRecord] =
    useState<MedicalAssessment | null>(null);

  const { data: cow, isLoading } = useQuery({
    queryKey: ["cow", id],
    queryFn: () => CowService.getOne(id!),
    enabled: !!id,
  });

  const { data: medicalHistory } = useQuery({
    queryKey: ["cow-medical", id],
    queryFn: () => CowService.getMedicalAssessmentsByCow(id!),
    enabled: !!id,
  });

  const { data: reproRecords } = useQuery({
    queryKey: ["repro-records", id],
    queryFn: () => CowService.getReproductionRecords(id!),
    enabled: !!id,
  });

  const { data: breeds } = useQuery({
    queryKey: ["breeds"],
    queryFn: DataService.getBreedTypes,
  });
  const { data: gyneStatuses } = useQuery({
    queryKey: ["gyne"],
    queryFn: DataService.getGynecologicalStatuses,
  });

  // Resolve Relations
  const breedName =
    typeof cow?.breed === "object"
      ? (cow.breed as any).name
      : breeds?.find((b) => b.id === cow?.breed)?.name || cow?.breed;
  const gyneStatusName =
    typeof cow?.gynecological_status === "object"
      ? (cow.gynecological_status as any).name
      : gyneStatuses?.find((g) => g.id === cow?.gynecological_status)?.name ||
        "Unknown";

  // Get Latest Health Info
  const latestAssessment = useMemo(
    () =>
      medicalHistory && medicalHistory.length > 0 ? medicalHistory[0] : null,
    [medicalHistory]
  );

  if (isLoading) return <PageLoader variant="inline" />;
  if (!cow) return <div className="p-8 text-center">Cow not found</div>;

  // Mock Age Calculation
  const age = cow.date_of_birth
    ? Math.floor(
        (new Date().getTime() - new Date(cow.date_of_birth).getTime()) /
          (1000 * 60 * 60 * 24 * 365.25)
      )
    : "N/A";

  const handleQuickAction = (action: string) => {
    toast({
      type: "info",
      title: action,
      message:
        "This quick action module will be implemented in the next update.",
      duration: 3000,
    });
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Vibrant Hero Section - Compact */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <div className="relative z-10 px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/cows")}
                className="text-slate-300 hover:text-white hover:bg-white/10 -ml-2 h-auto py-1 px-2 text-xs mb-2"
              >
                <ArrowLeft className="h-3 w-3 mr-1" /> Registry
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  {cow.cow_id}
                </h1>
                <div className="flex gap-2">
                  {(cow.statuses || [cow.status || "Active"]).map((s) => (
                    <Badge
                      key={s}
                      className={`px-2.5 py-0.5 border-0 backdrop-blur-md ${
                        s === "Sick"
                          ? "bg-rose-500/20 text-rose-200"
                          : s === "Pregnant"
                          ? "bg-amber-500/20 text-amber-200"
                          : s === "Lactating"
                          ? "bg-blue-500/20 text-blue-200"
                          : "bg-emerald-500/20 text-emerald-200"
                      }`}
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <span
                  className="flex items-center gap-1 cursor-pointer hover:text-white transition-colors"
                  onClick={() =>
                    navigate(
                      `/farms/${
                        typeof cow.farm === "string"
                          ? cow.farm
                          : (cow.farm as any).farm_id
                      }`
                    )
                  }
                >
                  <Home className="h-3 w-3" />{" "}
                  {typeof cow.farm === "string"
                    ? cow.farm
                    : (cow.farm as any).farm_id}
                </span>
                <span>•</span>
                <span>{breedName}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Parity
                </p>
                <p className="text-xl font-bold">{cow.parity}</p>
              </div>
              <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Age
                </p>
                <p className="text-xl font-bold">
                  {age}{" "}
                  <span className="text-xs font-normal text-slate-500">
                    yrs
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Sidebar) */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="overflow-hidden border-t-4 border-t-violet-500 shadow-md">
            <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Identity Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-5 space-y-4">
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-slate-500">Tag ID</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {cow.cow_id}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-slate-500">Sex</span>
                  <span className="font-medium">
                    {cow.sex === "F" ? "Female" : "Male"}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-slate-500">DOB</span>
                  <span className="font-medium">
                    {cow.date_of_birth || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
                  <span className="text-slate-500">Lactation #</span>
                  <span className="font-medium">{cow.lactation_number}</span>
                </div>
                <div className="flex justify-between text-sm pb-1">
                  <span className="text-slate-500">Gyn. Status</span>
                  <span className="font-medium text-violet-600 dark:text-violet-400">
                    {gyneStatusName}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 px-5 py-4 border-t border-slate-100 dark:border-slate-800">
                <LactationCycleVisual daysInMilk={cow.days_in_milk} />
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Quick Actions
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs justify-start bg-white dark:bg-slate-900"
                    onClick={() => handleQuickAction("Report Sickness")}
                  >
                    <Thermometer className="h-3 w-3 mr-2 text-rose-500" />{" "}
                    Report Sick
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs justify-start bg-white dark:bg-slate-900"
                    onClick={() => handleQuickAction("Record Heat")}
                  >
                    <Zap className="h-3 w-3 mr-2 text-amber-500" /> Record Heat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs justify-start bg-white dark:bg-slate-900"
                    onClick={() => handleQuickAction("Medical Check")}
                  >
                    <Stethoscope className="h-3 w-3 mr-2 text-blue-500" /> Med
                    Check
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs justify-start bg-white dark:bg-slate-900"
                    onClick={() => handleQuickAction("Update Production")}
                  >
                    <Milk className="h-3 w-3 mr-2 text-emerald-500" /> Add Milk
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Metrics Card */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-500" /> Health Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <BCSGauge score={cow.bcs} />
              </div>

              <div className="space-y-1">
                <HealthStatusIndicator
                  label="General Health"
                  value={
                    latestAssessment
                      ? typeof latestAssessment.general_health === "object"
                        ? latestAssessment.general_health.name
                        : String(latestAssessment.general_health)
                      : cow.status === "Sick"
                      ? "Poor"
                      : "Good"
                  }
                />
                <HealthStatusIndicator
                  label="Udder Health"
                  value={
                    latestAssessment
                      ? typeof latestAssessment.udder_health === "object"
                        ? latestAssessment.udder_health.name
                        : String(latestAssessment.udder_health)
                      : "Healthy"
                  }
                />
                <HealthStatusIndicator
                  label="Mastitis Status"
                  value={
                    latestAssessment
                      ? typeof latestAssessment.mastitis === "object"
                        ? latestAssessment.mastitis.name
                        : String(latestAssessment.mastitis)
                      : "Negative"
                  }
                />
              </div>

              {latestAssessment && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
                  Last assessed:{" "}
                  {new Date(
                    latestAssessment.assessment_date
                  ).toLocaleDateString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Main Content) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg mb-2">
                  <Milk className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Daily Yield
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {cow.average_daily_milk} L
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-emerald-300 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg mb-2">
                  <Scale className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Weight
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {cow.body_weight} kg
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-amber-300 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg mb-2">
                  <Activity className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-500 uppercase font-bold">
                  BCS Score
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {cow.bcs}
                </p>
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm hover:border-purple-300 transition-colors">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg mb-2">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="text-xs text-slate-500 uppercase font-bold">
                  Days In Milk
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {cow.days_in_milk}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs>
            <div className="border-b border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex space-x-8">
                <button
                  onClick={() => setActiveTab("timeline")}
                  className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "timeline"
                      ? "border-violet-500 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Medical Timeline
                </button>
                <button
                  onClick={() => setActiveTab("repro")}
                  className={`pb-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === "repro"
                      ? "border-violet-500 text-violet-600"
                      : "border-transparent text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Reproduction Stats
                </button>
              </div>
            </div>

            <TabsContent active={activeTab === "timeline"}>
              <Card>
                <CardHeader className="py-4 bg-slate-50/50 dark:bg-slate-900/30">
                  <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wide text-slate-500">
                    <FileText className="h-4 w-4" /> Complete History
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {medicalHistory && medicalHistory.length > 0 ? (
                    <div className="space-y-8 relative pl-4 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100 dark:before:bg-slate-800">
                      {medicalHistory.map((record) => (
                        <div
                          key={record.id}
                          className="relative flex gap-6 group"
                        >
                          <div
                            className={`relative z-10 h-10 w-10 shrink-0 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-950 shadow-sm ${
                              record.is_cow_sick
                                ? "bg-rose-100 text-rose-600"
                                : "bg-emerald-100 text-emerald-600"
                            }`}
                          >
                            {record.is_cow_sick ? (
                              <AlertTriangle className="h-5 w-5" />
                            ) : (
                              <CheckCircle2 className="h-5 w-5" />
                            )}
                          </div>
                          <div
                            className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-100 dark:border-slate-800 hover:border-violet-200 dark:hover:border-violet-900 hover:shadow-md transition-all cursor-pointer"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                                  {record.diagnosis ||
                                    (record.is_cow_sick
                                      ? "Sickness Reported"
                                      : "Routine Checkup")}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {new Date(
                                    record.assessment_date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  record.is_cow_sick ? "danger" : "success"
                                }
                              >
                                {record.is_cow_sick ? "Sick" : "Healthy"}
                              </Badge>
                            </div>
                            {record.is_cow_vaccinated && (
                              <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit mb-2 border border-blue-100 dark:border-blue-800">
                                <Syringe className="h-3 w-3" /> Vaccinated:{" "}
                                {record.vaccination_type}
                              </div>
                            )}
                            <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                              {record.notes || "No additional notes recorded."}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <div className="bg-slate-50 dark:bg-slate-900 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                        <Info className="h-8 w-8 opacity-20" />
                      </div>
                      No medical records found for this cow.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent active={activeTab === "repro"}>
              <div className="space-y-6">
                {/* Fertility Window Graph - Enhanced Light Theme with Date */}
                {cow.status !== "Pregnant" && (
                  <Card className="border-l-4 border-l-violet-500 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                    <CardContent className="p-6">
                      <FertilityWindowGraph />
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4 text-blue-700 dark:text-blue-300">
                        <Heart className="h-5 w-5" />
                        <h3 className="font-bold">Insemination</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                          <span className="text-blue-600/70">
                            Total Services
                          </span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {cow.number_of_inseminations}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                          <span className="text-blue-600/70">Last Date</span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {cow.last_date_insemination || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600/70">
                            Bull/Semen ID
                          </span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {cow.id_or_breed_bull_used || "N/A"}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4 text-purple-700 dark:text-purple-300">
                        <Calendar className="h-5 w-5" />
                        <h3 className="font-bold">Calving</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-purple-200/50 pb-2">
                          <span className="text-purple-600/70">
                            Last Calving
                          </span>
                          <span className="font-bold text-purple-900 dark:text-purple-100">
                            {cow.last_calving_date || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-purple-200/50 pb-2">
                          <span className="text-purple-600/70">
                            Total Calves
                          </span>
                          <span className="font-bold text-purple-900 dark:text-purple-100">
                            {cow.parity}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-purple-600/70">Ease</span>
                          <span className="font-bold text-purple-900 dark:text-purple-100">
                            Normal
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Heat Signs History - NEW SECTION */}
                <Card className="border-t-4 border-t-amber-500 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm uppercase text-slate-500 flex items-center gap-2">
                      <Flame className="h-4 w-4 text-amber-500" /> Reported Heat
                      Signs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reproRecords && reproRecords.length > 0 ? (
                      <div className="space-y-4 mt-2">
                        {reproRecords.map((record: any) => (
                          <div
                            key={record.id}
                            className="flex flex-col sm:flex-row sm:items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                          >
                            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[100px]">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                {new Date(
                                  record.heat_sign_start
                                ).toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(
                                  record.heat_sign_start
                                ).toLocaleTimeString([], {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            <div className="flex-1 bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-800">
                              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                Observed Signs:
                              </p>
                              <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                                {record.heat_signs_seen}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-slate-400 text-sm">
                        No heat signs recorded for this animal yet.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ViewAssessmentModal
        assessment={selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  );
}
