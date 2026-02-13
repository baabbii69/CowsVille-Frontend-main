import React, { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  Select,
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
  Edit3,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { MedicalAssessment, StaffMember, Cow } from "../types";
import { useToast } from "../context/ToastContext";
import { formatDate } from "../utils/dateUtils";

// --- Fertility Window Component ---
const FertilityWindowGraph = ({
  heatStartTime,
}: {
  heatStartTime?: string | Date;
}) => {
  // Mock start time if not provided (14 hours ago to show Green zone active)
  const start = useMemo(() => {
    if (heatStartTime) {
      // Parse the UTC time but treat it as Ethiopian local time
      const dateStr = typeof heatStartTime === 'string' ? heatStartTime : heatStartTime.toISOString();
      const localDateStr = dateStr.replace('Z', '');
      return new Date(localDateStr);
    }
    return null;
  }, [heatStartTime]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (!start) return null;

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
                hour12: true,
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
          viewBox={`-20 -25 ${graphWidth + 40} ${graphHeight + 25}`}
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timeline");
  const [selectedRecord, setSelectedRecord] =
    useState<MedicalAssessment | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

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

  const { data: insemRecords } = useQuery({
    queryKey: ["insem-records", id],
    queryFn: () => CowService.getInseminationRecords(id!),
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
  const { data: generalHealthStatuses } = useQuery({
    queryKey: ["general-health"],
    queryFn: DataService.getGeneralHealthStatuses,
  });
  const { data: udderHealthStatuses } = useQuery({
    queryKey: ["udder-health"],
    queryFn: DataService.getUdderHealthStatuses,
  });
  const { data: mastitisStatuses } = useQuery({
    queryKey: ["mastitis-health"],
    queryFn: DataService.getMastitisStatuses,
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

  // Calculate Current Insemination Date and Expected Calving
  const currentInseminationDate = useMemo(() => {
    const latestRecord = insemRecords
      ?.filter((r: any) => r.recorded_date)
      ?.sort((a: any, b: any) => new Date(b.recorded_date).getTime() - new Date(a.recorded_date).getTime())[0];
    
    if (latestRecord?.date_of_insemination) {
      return latestRecord.date_of_insemination;
    }
    
    if (latestRecord?.recorded_date) {
      return latestRecord.recorded_date.replace('Z', '');
    }
    
    return null;
  }, [insemRecords]);

  const expectedCalvingDate = useMemo(() => {
    // Only if pregnant and we have a starting date
    if (cow?.status !== 'Pregnant' || !currentInseminationDate) {
      return null;
    }
    
    const d = new Date(currentInseminationDate);
    d.setDate(d.getDate() + 280);
    return d;
  }, [cow?.status, currentInseminationDate]);

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

  // --- Edit Cow Logic ---
  const handleOpenEdit = () => {
    if (!cow) return;
    console.log("[CowEdit] Opening edit modal. Raw cow data:", cow);

    // Resolve breed to its ID for the select dropdown
    const breedId = typeof cow.breed === "object" ? (cow.breed as any).id : cow.breed;
    // Resolve gynecological_status to its ID
    const gyneId = typeof cow.gynecological_status === "object" ? (cow.gynecological_status as any).id : cow.gynecological_status;

    setEditForm({
      date_of_birth: cow.date_of_birth || "",
      sex: cow.sex || "F",
      breed: breedId || "",
      parity: cow.parity ?? 0,
      body_weight: cow.body_weight ?? 0,
      bcs: cow.bcs ?? 3.0,
      gynecological_status: gyneId || "",
      lactation_number: cow.lactation_number ?? 0,
      days_in_milk: cow.days_in_milk ?? 0,
      average_daily_milk: cow.average_daily_milk ?? 0,
      cow_inseminated_before: cow.cow_inseminated_before ?? false,
      is_pregnant: cow.status === "Pregnant" || false,
      last_date_insemination: cow.last_date_insemination || "",
      number_of_inseminations: cow.number_of_inseminations ?? 0,
      id_or_breed_bull_used: cow.id_or_breed_bull_used || "",
      last_calving_date: cow.last_calving_date || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditFormChange = (field: string, value: any) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = async () => {
    if (!cow || !cow.id) {
      console.error("[CowEdit] Cannot save: cow or cow.id is missing", cow);
      toast({ type: "error", title: "Save Failed", message: "Cow ID is missing. Cannot update." });
      return;
    }

    setIsSaving(true);
    console.log("[CowEdit] Raw editForm before coercion:", editForm);

    try {
      // Build the payload with proper types for the backend CowCreateUpdateSerializer
      const payload: Record<string, any> = {};

      // --- Breed: Backend expects name string, not ID ---
      if (editForm.breed) {
        const breedObj = breeds?.find((b) => b.id === Number(editForm.breed));
        if (breedObj) {
          payload.breed = breedObj.name;
          console.log("[CowEdit] Breed resolved:", editForm.breed, "->", breedObj.name);
        } else {
          payload.breed = String(editForm.breed);
          console.warn("[CowEdit] Could not resolve breed ID, sending raw:", editForm.breed);
        }
      }

      // --- Gynecological Status: Backend accepts PrimaryKeyRelatedField (number) ---
      if (editForm.gynecological_status) {
        payload.gynecological_status = Number(editForm.gynecological_status);
        console.log("[CowEdit] Gyne status:", payload.gynecological_status);
      }

      // --- BCS: Backend expects string, validates to Decimal ---
      payload.bcs = String(editForm.bcs);

      // --- Boolean fields: Backend expects "yes"/"no" strings ---
      payload.cow_inseminated_before = editForm.cow_inseminated_before ? "yes" : "no";

      // --- Pregnancy: Backend serializer has is_pregnant write_only field ---
      payload.is_pregnant = editForm.is_pregnant ? "yes" : "no";

      // --- Sex ---
      payload.sex = editForm.sex || "F";

      // --- Numeric fields: coerce to numbers ---
      payload.parity = Number(editForm.parity) || 0;
      payload.body_weight = Number(editForm.body_weight) || 0;
      payload.lactation_number = Number(editForm.lactation_number) || 0;
      payload.days_in_milk = Number(editForm.days_in_milk) || 0;
      payload.average_daily_milk = Number(editForm.average_daily_milk) || 0;
      payload.number_of_inseminations = Number(editForm.number_of_inseminations) || 0;

      // --- Date fields: send as string or null ---
      payload.date_of_birth = editForm.date_of_birth || null;
      payload.last_date_insemination = editForm.last_date_insemination || null;
      payload.last_calving_date = editForm.last_calving_date || null;

      // --- String fields ---
      payload.id_or_breed_bull_used = editForm.id_or_breed_bull_used || "";

      // --- Required for serializer: farm_id_input and cow_id_input ---
      const farmId = typeof cow.farm === "object" ? (cow.farm as any).farm_id : cow.farm;
      payload.farm_id_input = farmId;
      payload.cow_id_input = cow.cow_id;

      console.log("[CowEdit] Final payload:", JSON.stringify(payload, null, 2));

      await CowService.update(cow.id, payload);

      // --- Frontend Fix for Pregnancy Status ---
      // Backend PATCH update currently does not update pregnancy status (it's a side-effect in create only).
      // We manually create a reproduction record if the status has changed.
      const isOriginallyPregnant = cow.status === "Pregnant" || (reproRecords && reproRecords.some((r: any) => r.is_cow_pregnant));
      const newIsPregnant = editForm.is_pregnant;

      if (newIsPregnant !== undefined && newIsPregnant !== isOriginallyPregnant) {
        try {
          console.log(`[CowEdit] Pregnancy status changed to ${newIsPregnant}. Creating reproduction record...`);
          // Note: Reproduction model requires FK IDs (integers), not string IDs.
          // cow.farm should be the Farm PK (integer) from the read serializer.
          // cow.id is the Cow PK (integer).
          await CowService.createReproductionRecord({
            farm: typeof cow.farm === "object" ? (cow.farm as any).id : cow.farm,
            cow: cow.id,
            is_cow_pregnant: newIsPregnant,
            // If becoming pregnant, optionally set date. For now, leave blank or implementation choice.
            // If setting to 'no', is_cow_pregnant: false is sufficient.
            pregnancy_date: newIsPregnant ? new Date().toISOString().split('T')[0] : null
          });
          console.log("[CowEdit] Reproduction record created successfully.");
        } catch (reproError) {
          console.error("[CowEdit] Failed to create reproduction record:", reproError);
          // Don't block the UI flow, just log it. The main update succeeded.
          toast({ type: "error", title: "Warning", message: "Cow updated, but pregnancy record creation failed." });
        }
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["cow", id] });
      queryClient.invalidateQueries({ queryKey: ["cows"] });

      setIsEditModalOpen(false);
      toast({ type: "success", title: "Cow Updated", message: `${cow.cow_id} has been successfully updated.` });
    } catch (error: any) {
      console.error("[CowEdit] Save failed:", error);
      const detail = error?.response?.data;
      let msg = "Could not update cow details. Check console for details.";
      if (detail) {
        if (typeof detail === "string") msg = detail;
        else if (typeof detail === "object") {
          // Flatten DRF error format: {field: ["error1"]} or {field: "error"}
          const parts = Object.entries(detail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
          msg = parts.join(" | ");
        }
      }
      toast({ type: "error", title: "Update Failed", message: msg });
    } finally {
      setIsSaving(false);
    }
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
                    <React.Fragment key={s}>
                      <Badge
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
                    </React.Fragment>
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
                <span className="uppercase">{breedName}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-3">
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Parity
                  </p>
                  <p className="text-xl font-bold">{cow.parity}</p>
                </div>
                <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Date of Birth
                  </p>
                  <p className="text-xl font-bold">
                    {cow.date_of_birth ? formatDate(cow.date_of_birth) : "N/A"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenEdit}
                className="text-white hover:bg-white/10 border border-white/20 rounded-xl px-4 py-2"
              >
                <Edit3 className="h-4 w-4 mr-2" /> Edit
              </Button>
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
                    {cow.date_of_birth ? formatDate(cow.date_of_birth) : "N/A"}
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
                        : generalHealthStatuses?.find(
                            (s) => s.id === latestAssessment.general_health
                          )?.name || String(latestAssessment.general_health)
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
                        : udderHealthStatuses?.find(
                            (s) => s.id === latestAssessment.udder_health
                          )?.name || String(latestAssessment.udder_health)
                      : "Healthy"
                  }
                />
                <HealthStatusIndicator
                  label="Mastitis Status"
                  value={
                    latestAssessment
                      ? typeof latestAssessment.mastitis === "object"
                        ? latestAssessment.mastitis.name
                        : mastitisStatuses?.find(
                            (s) => s.id === latestAssessment.mastitis
                          )?.name || String(latestAssessment.mastitis)
                      : "Negative"
                  }
                />
              </div>

              {latestAssessment && (
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 text-center">
                  Last assessed:{" "}
                  {formatDate(latestAssessment.assessment_date)}
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
                  Reproductive Status
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
                                  {formatDate(record.assessment_date)}
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
                {cow.status !== "Pregnant" && reproRecords?.[0]?.heat_sign_start && (
                  <Card className="border-l-4 border-l-violet-500 shadow-md bg-white dark:bg-slate-900 overflow-hidden">
                    <CardContent className="p-6">
                      <FertilityWindowGraph 
                        heatStartTime={reproRecords[0].heat_sign_start}
                      />
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
                          <span className="text-blue-600/70">Last Date of Insemination</span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {cow.last_date_insemination ? formatDate(cow.last_date_insemination) : "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-blue-200/50 pb-2">
                          <span className="text-blue-600/70">
                            Current Insemination Date
                          </span>
                          <span className="font-bold text-blue-900 dark:text-blue-100">
                            {formatDate(currentInseminationDate)}
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

                  {/* Pregnancy Information Card - Always visible */}
                  <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4 text-amber-700 dark:text-amber-300">
                        <Calendar className="h-5 w-5" />
                        <h3 className="font-bold">Pregnancy Info</h3>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between border-b border-amber-200/50 pb-2">
                          <span className="text-amber-600/70">
                            Pregnant
                          </span>
                          <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                            (cow.status === "Pregnant" || (reproRecords && reproRecords.some((r: any) => r.is_cow_pregnant)))
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}>
                            {(cow.status === "Pregnant" || (reproRecords && reproRecords.some((r: any) => r.is_cow_pregnant))) ? "Yes" : "No"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-amber-200/50 pb-2">
                          <span className="text-amber-600/70">
                            Service/Conception
                          </span>
                          <span className="font-bold text-amber-900 dark:text-amber-100">
                            {cow.number_of_inseminations || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-amber-600/70">
                            Expected Calving
                          </span>
                          <span className="font-bold text-amber-900 dark:text-amber-100">
                            {formatDate(expectedCalvingDate)}
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
                            Last Calving Date
                          </span>
                          <span className="font-bold text-purple-900 dark:text-purple-100">
                            {(() => {
                              // First try to get from reproduction records
                              const recordCalvingDate = reproRecords?.find((r: any) => r.calving_date)?.calving_date;
                              if (recordCalvingDate) {
                                return formatDate(recordCalvingDate);
                              }
                              // Fallback to cow's last_calving_date field
                              if (cow.last_calving_date) {
                                return formatDate(cow.last_calving_date);
                              }
                              return "N/A";
                            })()}
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
                        {reproRecords
                          .filter((r: any) => r.heat_sign_start && r.heat_signs_seen)
                          .map((record: any) => (
                          <div
                            key={record.id}
                            className="flex flex-col sm:flex-row sm:items-start gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0"
                          >
                            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-center min-w-[100px]">
                              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                                {formatDate(record.heat_sign_start)}
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
                                {record.heat_signs_seen
                                  ? record.heat_signs_seen
                                      .split(/[ ,]+/)
                                      .map((s: string) => s.replace(/_/g, " "))
                                      .join(", ")
                                  : "No signs recorded"}
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

      {/* --- Edit Cow Modal --- */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit ${cow.cow_id}`}
        className="max-w-2xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Section: Demographics */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" /> Demographics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Cow ID</label>
                <input
                  type="text"
                  value={cow.cow_id}
                  disabled
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Sex</label>
                <select
                  value={editForm.sex || "F"}
                  onChange={(e) => handleEditFormChange("sex", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="F">Female</option>
                  <option value="M">Male</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={editForm.date_of_birth || ""}
                  onChange={(e) => handleEditFormChange("date_of_birth", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Breed</label>
                <select
                  value={editForm.breed || ""}
                  onChange={(e) => handleEditFormChange("breed", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Select Breed</option>
                  {breeds?.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Health Metrics */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Health Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Parity</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.parity ?? 0}
                  onChange={(e) => handleEditFormChange("parity", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Body Weight (kg)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm.body_weight ?? 0}
                  onChange={(e) => handleEditFormChange("body_weight", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">BCS (1.0 - 5.0)</label>
                <select
                  value={editForm.bcs ?? 3.0}
                  onChange={(e) => handleEditFormChange("bcs", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  {[1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0].map((v) => (
                    <option key={v} value={v}>{v.toFixed(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Gyn. Status</label>
                <select
                  value={editForm.gynecological_status || ""}
                  onChange={(e) => handleEditFormChange("gynecological_status", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="">Select Status</option>
                  {gyneStatuses?.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Milk Production */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Milk className="h-4 w-4" /> Milk Production
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Lactation #</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.lactation_number ?? 0}
                  onChange={(e) => handleEditFormChange("lactation_number", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Days in Milk</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.days_in_milk ?? 0}
                  onChange={(e) => handleEditFormChange("days_in_milk", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Avg Daily Milk (L)</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm.average_daily_milk ?? 0}
                  onChange={(e) => handleEditFormChange("average_daily_milk", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Reproduction */}
          <div>
            <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4" /> Reproduction
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Inseminated Before?</label>
                <select
                  value={editForm.cow_inseminated_before ? "yes" : "no"}
                  onChange={(e) => handleEditFormChange("cow_inseminated_before", e.target.value === "yes")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Pregnant?</label>
                <select
                  value={editForm.is_pregnant ? "yes" : "no"}
                  onChange={(e) => handleEditFormChange("is_pregnant", e.target.value === "yes")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1"># Inseminations</label>
                <input
                  type="number"
                  min={0}
                  value={editForm.number_of_inseminations ?? 0}
                  onChange={(e) => handleEditFormChange("number_of_inseminations", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Last Insemination Date</label>
                <input
                  type="date"
                  value={editForm.last_date_insemination || ""}
                  onChange={(e) => handleEditFormChange("last_date_insemination", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Bull/Semen ID</label>
                <input
                  type="text"
                  value={editForm.id_or_breed_bull_used || ""}
                  onChange={(e) => handleEditFormChange("id_or_breed_bull_used", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Last Calving Date</label>
                <input
                  type="date"
                  value={editForm.last_calving_date || ""}
                  onChange={(e) => handleEditFormChange("last_calving_date", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            variant="outline"
            onClick={() => setIsEditModalOpen(false)}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={isSaving}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            {isSaving ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> Save Changes</>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
