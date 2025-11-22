import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CowService, FarmService, DataService } from "../services/api";
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Badge,
  Modal,
  Select,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Switch,
} from "../components/ui";
import {
  Plus,
  Search,
  X,
  Activity,
  Milk,
  Heart,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";

// Strict Schema Matching Model
const cowSchema = z.object({
  cow_id: z.string().min(1, "Cow ID required"),
  farm: z.string().min(1, "Farm required"),
  breed: z.coerce.number(),
  sex: z.enum(["F", "M"]),
  date_of_birth: z.string().optional(),

  // Health
  body_weight: z.coerce.number().min(0),
  bcs: z.coerce.number().min(1).max(5),
  parity: z.coerce.number().min(0),
  gynecological_status: z.coerce.number(),

  // Production
  lactation_number: z.coerce.number().min(0),
  days_in_milk: z.coerce.number().min(0),
  average_daily_milk: z.coerce.number().min(0),

  // Reproduction
  cow_inseminated_before: z.boolean(),
  number_of_inseminations: z.coerce.number().min(0),
  last_date_insemination: z.string().optional(),
  id_or_breed_bull_used: z.string().optional(),
  last_calving_date: z.string().optional(),
});

type CowFormValues = z.infer<typeof cowSchema>;

export default function Cows() {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState("identity");

  // Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [breedFilter, setBreedFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cows, isLoading } = useQuery({
    queryKey: ["cows"],
    queryFn: CowService.getAll,
  });
  const { data: farms } = useQuery({
    queryKey: ["farms"],
    queryFn: FarmService.getAll,
  });
  const { data: breeds } = useQuery({
    queryKey: ["breeds"],
    queryFn: DataService.getBreedTypes,
  });
  const { data: gyneStatuses } = useQuery({
    queryKey: ["gyne"],
    queryFn: DataService.getGynecologicalStatuses,
  });

  // Reset to first page when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, breedFilter]);

  const createMutation = useMutation({
    mutationFn: CowService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cows"] });
      setIsCreating(false);
      reset();
      setActiveTab("identity");
      toast({
        type: "success",
        title: "Cow Registered",
        message: "New livestock record created successfully.",
      });
    },
    onError: () => {
      toast({
        type: "error",
        title: "Registration Failed",
        message: "Could not register cow. Please verify the details.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CowFormValues>({
    resolver: zodResolver(cowSchema),
    defaultValues: {
      sex: "F",
      bcs: 3,
      parity: 0,
      lactation_number: 0,
      cow_inseminated_before: false,
      number_of_inseminations: 0,
    },
  });

  const inseminatedBefore = watch("cow_inseminated_before");

  const onSubmit = (data: CowFormValues) => {
    createMutation.mutate(data as any);
  };

  // Enhanced Filtering Logic
  const filteredCows =
    cows?.filter((cow) => {
      const matchesSearch =
        cow.cow_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof cow.farm === "string"
          ? cow.farm.toLowerCase()
          : (cow.farm as any).farm_id.toLowerCase()
        ).includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || cow.status === statusFilter;
      const matchesBreed =
        breedFilter === "all" || cow.breed.toString() === breedFilter;

      return matchesSearch && matchesStatus && matchesBreed;
    }) || [];

  // Pagination Logic
  const totalItems = filteredCows.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCows = filteredCows.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Livestock Registry
          </h2>
          <p className="text-slate-500 text-sm">
            Manage individual cow records.
          </p>
        </div>
        <Button
          onClick={() => setIsCreating(true)}
          className="shadow-md shadow-primary-500/20"
        >
          <Plus className="mr-2 h-4 w-4" /> Register Cow
        </Button>
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Tag ID or Farm ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 overflow-x-auto pb-1 lg:pb-0">
          <div className="min-w-[150px]">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 h-10 text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Healthy">Healthy</option>
              <option value="Sick">Sick</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Lactating">Lactating</option>
            </Select>
          </div>
          <div className="min-w-[150px]">
            <Select
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 h-10 text-sm"
            >
              <option value="all">All Breeds</option>
              {breeds?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setBreedFilter("all");
            }}
            className="text-slate-500 hover:text-slate-700"
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 uppercase text-xs font-semibold sticky top-0">
              <tr>
                <th className="px-6 py-4">Cow ID</th>
                <th className="px-6 py-4">Farm</th>
                <th className="px-6 py-4">Breed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Loading livestock...
                  </td>
                </tr>
              ) : paginatedCows.length > 0 ? (
                paginatedCows.map((cow) => (
                  <tr
                    key={cow.cow_id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/cows/${cow.cow_id}`)}
                  >
                    <td className="px-6 py-4 font-medium text-primary-600">
                      {cow.cow_id}
                    </td>
                    <td className="px-6 py-4">
                      {typeof cow.farm === "string"
                        ? cow.farm
                        : (cow.farm as any).farm_id}
                    </td>
                    <td className="px-6 py-4">
                      {breeds?.find((b) => b.id === cow.breed)?.name ||
                        cow.breed}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {(cow.statuses || [cow.status || "Active"]).map((s) => (
                          <Badge
                            key={s}
                            variant={
                              s === "Sick"
                                ? "danger"
                                : s === "Pregnant"
                                ? "warning"
                                : s === "Lactating"
                                ? "info"
                                : "success"
                            }
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full">
                        <Filter className="h-6 w-6 text-slate-400" />
                      </div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        No cows found
                      </p>
                      <p className="text-xs">
                        Try adjusting your search or filters.
                      </p>
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearchTerm("");
                          setStatusFilter("all");
                          setBreedFilter("all");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {!isLoading && totalItems > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
            <div className="text-xs text-slate-500">
              Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(endIndex, totalItems)}
              </span>{" "}
              of <span className="font-medium">{totalItems}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 px-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Register New Cow"
        className="max-w-2xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger
                active={activeTab === "identity"}
                onClick={() => setActiveTab("identity")}
              >
                Identity
              </TabsTrigger>
              <TabsTrigger
                active={activeTab === "health"}
                onClick={() => setActiveTab("health")}
              >
                Health
              </TabsTrigger>
              <TabsTrigger
                active={activeTab === "production"}
                onClick={() => setActiveTab("production")}
              >
                Production
              </TabsTrigger>
              <TabsTrigger
                active={activeTab === "repro"}
                onClick={() => setActiveTab("repro")}
              >
                Repro
              </TabsTrigger>
            </TabsList>

            <TabsContent
              active={activeTab === "identity"}
              className="animate-in fade-in slide-in-from-left-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cow ID (Tag)</Label>
                  <Input {...register("cow_id")} placeholder="C-001" />
                  {errors.cow_id && (
                    <span className="text-xs text-red-500">
                      {errors.cow_id.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Farm</Label>
                  <Select {...register("farm")}>
                    <option value="">Select Farm</option>
                    {farms?.map((f) => (
                      <option key={f.farm_id} value={f.farm_id}>
                        {f.owner_name} ({f.farm_id})
                      </option>
                    ))}
                  </Select>
                  {errors.farm && (
                    <span className="text-xs text-red-500">
                      {errors.farm.message}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Breed</Label>
                  <Select {...register("breed")}>
                    {breeds?.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sex</Label>
                  <Select {...register("sex")}>
                    <option value="F">Female</option>
                    <option value="M">Male</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input type="date" {...register("date_of_birth")} />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              active={activeTab === "health"}
              className="animate-in fade-in slide-in-from-right-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Body Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("body_weight")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Body Condition Score (1-5)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    {...register("bcs")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Parity</Label>
                  <Input type="number" {...register("parity")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Gynecological Status</Label>
                  <Select {...register("gynecological_status")}>
                    {gyneStatuses?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              active={activeTab === "production"}
              className="animate-in fade-in slide-in-from-right-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lactation Number</Label>
                  <Input type="number" {...register("lactation_number")} />
                </div>
                <div className="space-y-2">
                  <Label>Days in Milk</Label>
                  <Input type="number" {...register("days_in_milk")} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Average Daily Milk (L)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    {...register("average_daily_milk")}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent
              active={activeTab === "repro"}
              className="animate-in fade-in slide-in-from-right-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2 flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <Switch {...register("cow_inseminated_before")} />
                  <span className="text-sm font-medium">
                    Cow Inseminated Before?
                  </span>
                </div>

                {inseminatedBefore && (
                  <>
                    <div className="space-y-2">
                      <Label>Number of Inseminations</Label>
                      <Input
                        type="number"
                        {...register("number_of_inseminations")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Insemination Date</Label>
                      <Input
                        type="date"
                        {...register("last_date_insemination")}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bull ID / Breed Used</Label>
                      <Input {...register("id_or_breed_bull_used")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Calving Date</Label>
                      <Input type="date" {...register("last_calving_date")} />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreating(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
