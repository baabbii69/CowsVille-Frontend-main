import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FarmService, CowService, DataService } from "../services/api";
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Modal,
  Select,
  Badge,
} from "../components/ui";
import {
  Plus,
  Search,
  MapPin,
  Droplets,
  Home,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Phone,
  User,
  AlertTriangle,
  Filter,
  ChevronDown,
  Wheat,
  LayoutGrid,
  Star,
  Activity,
} from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

// Schema strictly matching Django Model
const farmSchema = z.object({
  farm_id: z.string().min(1, "Farm ID is required"),
  owner_name: z.string().min(2, "Owner name is required"),
  address: z.string().min(1, "Address is required"),
  telephone_number: z.string().regex(/^\+?1?\d{9,15}$/, "Invalid phone number"),
  location_gps: z.string().optional(),
  cluster_number: z.string().optional(),
  fertility_camp_no: z.coerce.number().min(0, "Must be positive"),

  // Population
  total_number_of_cows: z.coerce.number().min(0),
  number_of_calves: z.coerce.number().min(0),
  number_of_milking_cows: z.coerce.number().min(0),
  total_daily_milk: z.coerce.number().min(0),

  // Infra
  type_of_housing: z.coerce.number(),
  type_of_floor: z.coerce.number(),

  // Feeding
  main_feed: z.string().min(1, "Main feed required"),
  rate_of_cow_feeding: z.coerce.number(),
  source_of_water: z.coerce.number(),
  rate_of_water_giving: z.coerce.number(),

  farm_hygiene_score: z.coerce.number().min(1).max(4),
});

type FarmFormValues = z.infer<typeof farmSchema>;

const STEPS = [
  { id: "basic", title: "Identity", subtitle: "Owner & Location", icon: User },
  {
    id: "stats",
    title: "Livestock",
    subtitle: "Herd & Production",
    icon: Activity,
  },
  { id: "infra", title: "Operations", subtitle: "Infra & Hygiene", icon: Home },
];

export default function Farms() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { toast } = useToast();

  // Filtering State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterHygiene, setFilterHygiene] = useState<string>("all");
  const [filterHousing, setFilterHousing] = useState<string>("all");

  const queryClient = useQueryClient();

  // Data Queries
  const { data: farms, isLoading } = useQuery({
    queryKey: ["farms"],
    queryFn: FarmService.getAll,
  });

  const { data: cows } = useQuery({
    queryKey: ["cows"],
    queryFn: CowService.getAll,
  });
  const { data: housingTypes } = useQuery({
    queryKey: ["housing"],
    queryFn: DataService.getHousingTypes,
  });
  const { data: floorTypes } = useQuery({
    queryKey: ["floors"],
    queryFn: DataService.getFloorTypes,
  });
  const { data: waterSources } = useQuery({
    queryKey: ["water"],
    queryFn: DataService.getWaterSources,
  });
  const { data: feedingFreqs } = useQuery({
    queryKey: ["feeding"],
    queryFn: DataService.getFeedingFrequencies,
  });

  const createMutation = useMutation({
    mutationFn: FarmService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farms"] });
      setIsCreating(false);
      reset();
      setCurrentStep(0);
      toast({
        type: "success",
        title: "Farm Registered",
        message: "New farm has been successfully added to the system.",
      });
    },
    onError: () => {
      toast({
        type: "error",
        title: "Registration Failed",
        message: "Could not create farm. Please check your inputs.",
      });
    },
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      type_of_housing: 1,
      type_of_floor: 1,
      rate_of_cow_feeding: 1,
      rate_of_water_giving: 1,
      source_of_water: 1,
      farm_hygiene_score: 3,
      fertility_camp_no: 0,
      total_number_of_cows: 0,
      number_of_calves: 0,
      number_of_milking_cows: 0,
      total_daily_milk: 0,
    },
  });

  // Debounce Search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const onSubmit = (data: FarmFormValues) => {
    createMutation.mutate(data as any);
  };

  const nextStep = async () => {
    const stepFields = [
      [
        "farm_id",
        "owner_name",
        "address",
        "telephone_number",
        "fertility_camp_no",
        "cluster_number",
        "location_gps",
      ],
      [
        "total_number_of_cows",
        "number_of_calves",
        "number_of_milking_cows",
        "total_daily_milk",
      ],
      [
        "type_of_housing",
        "type_of_floor",
        "main_feed",
        "rate_of_cow_feeding",
        "source_of_water",
        "rate_of_water_giving",
        "farm_hygiene_score",
      ],
    ];

    const isValid = await trigger(stepFields[currentStep] as any);
    if (isValid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  // Advanced Filtering Logic
  const filteredFarms = farms?.filter((f) => {
    const matchesSearch =
      f.owner_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      f.farm_id.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesHygiene =
      filterHygiene === "all" ||
      f.farm_hygiene_score.toString() === filterHygiene;

    // Handle potentially populated object or ID for housing
    const housingId =
      typeof f.type_of_housing === "object"
        ? (f.type_of_housing as any).id
        : f.type_of_housing;
    const matchesHousing =
      filterHousing === "all" || housingId.toString() === filterHousing;

    return matchesSearch && matchesHygiene && matchesHousing;
  });

  return (
    <div className="space-y-6 min-h-screen pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Farm Registry
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage operations, infrastructure, and livestock data.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 text-white px-6 py-2.5 rounded-xl font-medium transition-all active:scale-95"
        >
          <Plus className="mr-2 h-5 w-5" /> Register New Farm
        </Button>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Owner Name, Farm ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full lg:w-auto overflow-x-auto">
          <div className="min-w-[160px]">
            <Select
              value={filterHygiene}
              onChange={(e) => setFilterHygiene(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11"
            >
              <option value="all">All Hygiene Scores</option>
              <option value="4">Excellent (4)</option>
              <option value="3">Good (3)</option>
              <option value="2">Fair (2)</option>
              <option value="1">Poor (1)</option>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <Select
              value={filterHousing}
              onChange={(e) => setFilterHousing(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 h-11"
            >
              <option value="all">All Housing Types</option>
              {housingTypes?.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setFilterHygiene("all");
              setFilterHousing("all");
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Farm Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse"
            />
          ))
        ) : filteredFarms?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-full mb-4 animate-bounce-slow">
              <Filter className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              No farms match your criteria
            </h3>
            <p className="text-sm text-slate-400 mt-2 mb-6 max-w-md text-center">
              Try adjusting your filters or search term to find what you're
              looking for.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearch("");
                setFilterHygiene("all");
                setFilterHousing("all");
              }}
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          filteredFarms?.map((farm) => (
            <Card
              key={farm.farm_id}
              className="group hover:shadow-2xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div onClick={() => navigate(`/farms/${farm.farm_id}`)}>
                {/* Card Header with Pattern */}
                <div className="relative h-24 bg-gradient-to-r from-emerald-600 to-teal-600 overflow-hidden">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="absolute -bottom-8 left-6">
                    <div className="h-16 w-16 rounded-2xl bg-white dark:bg-slate-800 shadow-lg flex items-center justify-center text-2xl font-bold text-emerald-600 border-4 border-white dark:border-slate-900">
                      {farm.owner_name.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-black/20 hover:bg-black/30 text-white border-0 backdrop-blur-md">
                      {farm.farm_id}
                    </Badge>
                  </div>
                </div>

                <CardContent className="pt-10 p-6 space-y-5">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white truncate">
                      {farm.owner_name}
                    </h3>
                    <div className="flex items-center text-slate-500 text-xs mt-1 gap-1">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{farm.address}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="text-center p-1">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                        Cows
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {cows
                          ? cows.filter(
                              (c) =>
                                c.farm === farm.farm_id ||
                                (typeof c.farm === "object" &&
                                  c.farm.farm_id === farm.farm_id)
                            ).length
                          : 0}
                      </p>
                    </div>
                    <div className="text-center p-1 border-l border-slate-200 dark:border-slate-800">
                      <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                        Daily Milk
                      </p>
                      <p className="text-lg font-bold text-emerald-600">
                        {cows
                          ? cows
                              .filter(
                                (c) =>
                                  c.farm === farm.farm_id ||
                                  (typeof c.farm === "object" &&
                                    c.farm.farm_id === farm.farm_id)
                              )
                              .reduce(
                                (acc, c) =>
                                  acc + (Number(c.average_daily_milk) || 0),
                                0
                              )
                              .toFixed(1)
                          : 0}{" "}
                        L
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-500">
                        Hygiene:
                      </span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= farm.farm_hygiene_score
                                ? "fill-amber-400 text-amber-400"
                                : "fill-slate-200 text-slate-200 dark:fill-slate-800 dark:text-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center text-emerald-600 text-xs font-bold group-hover:translate-x-1 transition-transform">
                      View Details <ArrowRight className="h-3 w-3 ml-1" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Premium Add Farm Modal */}
      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title=""
        className="max-w-5xl p-0 overflow-hidden bg-white dark:bg-slate-900"
      >
        <div className="flex flex-col md:flex-row h-[85vh] md:h-[700px]">
          {/* Left Sidebar (Progress) */}
          <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-950 p-8 flex flex-col justify-between border-r border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                New Registration
              </h2>
              <p className="text-sm text-slate-500 mb-8">
                Complete the steps to onboard a new farm into the system.
              </p>

              <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[19px] top-2 bottom-10 w-0.5 bg-slate-200 dark:bg-slate-800 -z-10"></div>

                {STEPS.map((step, idx) => {
                  const isActive = idx === currentStep;
                  const isCompleted = idx < currentStep;
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 relative"
                    >
                      <div
                        className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 z-10 ${
                          isActive
                            ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                            : isCompleted
                            ? "border-emerald-600 bg-white text-emerald-600"
                            : "border-slate-200 bg-white text-slate-300 dark:bg-slate-900 dark:border-slate-700"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-6 w-6" />
                        ) : (
                          <step.icon className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            isActive
                              ? "text-slate-900 dark:text-white"
                              : "text-slate-500"
                          }`}
                        >
                          {step.title}
                        </p>
                        <p className="text-xs text-slate-400">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex gap-2 items-start text-blue-700 dark:text-blue-300">
                <Activity className="h-5 w-5 shrink-0" />
                <p className="text-xs leading-relaxed">
                  <strong>Tip:</strong> Ensure GPS coordinates are accurate for
                  mapping features. Hygiene scores significantly impact the
                  farm's health rating.
                </p>
              </div>
            </div>
          </div>

          {/* Right Content (Form) */}
          <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {STEPS[currentStep].title} Details
              </h3>
              <div className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                Step {currentStep + 1} of {STEPS.length}
              </div>
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto p-6 md:p-8">
                <AnimatePresence mode="wait">
                  {currentStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <div className="space-y-2">
                        <Label>
                          Farm ID <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            {...register("farm_id")}
                            placeholder="e.g. F-2024-001"
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                          />
                        </div>
                        {errors.farm_id && (
                          <span className="text-xs text-red-500 flex items-center gap-1">
                            {errors.farm_id.message}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Owner Name <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            {...register("owner_name")}
                            placeholder="Full Legal Name"
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                          />
                        </div>
                        {errors.owner_name && (
                          <span className="text-xs text-red-500">
                            {errors.owner_name.message}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>
                          Address <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          {...register("address")}
                          placeholder="Region, Zone, Woreda, Kebele"
                          className="bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                        />
                        {errors.address && (
                          <span className="text-xs text-red-500">
                            {errors.address.message}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative group">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            {...register("telephone_number")}
                            placeholder="+251..."
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                          />
                        </div>
                        {errors.telephone_number && (
                          <span className="text-xs text-red-500">
                            {errors.telephone_number.message}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>GPS Location</Label>
                        <div className="relative group">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                          <Input
                            {...register("location_gps")}
                            placeholder="Lat, Long"
                            className="pl-10 bg-slate-50 border-slate-200 focus:bg-white transition-all h-11"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Cluster ID</Label>
                        <Input
                          {...register("cluster_number")}
                          placeholder="Cluster code"
                          className="bg-slate-50 border-slate-200 focus:bg-white h-11"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fertility Camp</Label>
                        <Input
                          type="number"
                          {...register("fertility_camp_no")}
                          className="bg-slate-50 border-slate-200 focus:bg-white h-11"
                        />
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-2 gap-6">
                        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-2">
                          <Label className="text-slate-500">
                            Total Herd Size
                          </Label>
                          <Input
                            type="number"
                            {...register("total_number_of_cows")}
                            className="text-center text-2xl font-bold h-14 bg-white border-slate-200 shadow-sm"
                          />
                        </div>
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800 text-center space-y-2">
                          <Label className="text-emerald-700 dark:text-emerald-400">
                            Daily Milk (L)
                          </Label>
                          <Input
                            type="number"
                            {...register("total_daily_milk")}
                            className="text-center text-2xl font-bold h-14 bg-white border-emerald-200 text-emerald-700 shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label>Milking Cows</Label>
                          <Input
                            type="number"
                            {...register("number_of_milking_cows")}
                            className="h-11 bg-slate-50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Calves</Label>
                          <Input
                            type="number"
                            {...register("number_of_calves")}
                            className="h-11 bg-slate-50"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      {/* Infra Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-4">
                          Infrastructure
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>Housing</Label>
                            <Select
                              {...register("type_of_housing")}
                              className="h-12 bg-slate-50"
                            >
                              {housingTypes?.map((h) => (
                                <option key={h.id} value={h.id}>
                                  {h.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Flooring</Label>
                            <Select
                              {...register("type_of_floor")}
                              className="h-12 bg-slate-50"
                            >
                              {floorTypes?.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Feeding Section */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-4">
                          Feed & Water
                        </h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2 md:col-span-2">
                            <Label>Main Feed Source</Label>
                            <div className="relative group">
                              <Wheat className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              <Input
                                {...register("main_feed")}
                                placeholder="e.g. Hay, Silage"
                                className="pl-10 h-12 bg-slate-50"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Feeding Frequency</Label>
                            <Select
                              {...register("rate_of_cow_feeding")}
                              className="h-12 bg-slate-50"
                            >
                              {feedingFreqs?.map((f) => (
                                <option key={f.id} value={f.id}>
                                  {f.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Water Source</Label>
                            <Select
                              {...register("source_of_water")}
                              className="h-12 bg-slate-50"
                            >
                              {waterSources?.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Hygiene Score Cards */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-4">
                          Hygiene Assessment
                        </h4>
                        <Controller
                          name="farm_hygiene_score"
                          control={control}
                          render={({ field }) => (
                            <div className="grid grid-cols-4 gap-3">
                              {[1, 2, 3, 4].map((score) => {
                                const isSelected =
                                  Number(field.value) === score;
                                const colorClass =
                                  score === 1
                                    ? "bg-red-50 border-red-200 text-red-700"
                                    : score === 2
                                    ? "bg-orange-50 border-orange-200 text-orange-700"
                                    : score === 3
                                    ? "bg-blue-50 border-blue-200 text-blue-700"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-700";
                                const selectedClass =
                                  score === 1
                                    ? "ring-2 ring-red-500 ring-offset-2"
                                    : score === 2
                                    ? "ring-2 ring-orange-500 ring-offset-2"
                                    : score === 3
                                    ? "ring-2 ring-blue-500 ring-offset-2"
                                    : "ring-2 ring-emerald-500 ring-offset-2";

                                return (
                                  <div
                                    key={score}
                                    onClick={() => field.onChange(score)}
                                    className={`cursor-pointer rounded-xl p-3 border text-center transition-all ${
                                      isSelected ? selectedClass : ""
                                    } ${colorClass} hover:opacity-90`}
                                  >
                                    <span className="text-2xl font-bold block">
                                      {score}
                                    </span>
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                                      {score === 1
                                        ? "Poor"
                                        : score === 2
                                        ? "Fair"
                                        : score === 3
                                        ? "Good"
                                        : "Excel."}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {currentStep < STEPS.length - 1 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="bg-slate-900 text-white hover:bg-slate-800 px-8 h-11 rounded-xl shadow-lg shadow-slate-900/20"
                  >
                    Next Step <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    isLoading={createMutation.isPending}
                    className="bg-emerald-600 text-white hover:bg-emerald-700 px-8 h-11 rounded-xl shadow-lg shadow-emerald-600/20"
                  >
                    Register Farm <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
}
