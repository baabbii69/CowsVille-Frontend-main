import axios from "axios";
import {
  LoginCredentials,
  Farm,
  Cow,
  ChoiceType,
  StaffMember,
  MedicalAssessment,
} from "../types";

export const API_BASE_URL = "https://apiv3.cowsville-aau-cvma.com/api";

// --- DEMO MODE / MOCK DATA SETUP ---
let isDemo = localStorage.getItem("demo_mode") === "true";

export const setDemoMode = (enable: boolean) => {
  isDemo = enable;
  if (enable) {
    localStorage.setItem("demo_mode", "true");
  } else {
    localStorage.removeItem("demo_mode");
  }
};

// Helper for mock choices
const createChoice = (id: number, name: string): ChoiceType => ({
  id,
  name,
  display_name: name,
});

const MOCK_HOUSING: ChoiceType[] = [
  createChoice(1, "Barn"),
  createChoice(2, "Open Pasture"),
  createChoice(3, "Tie Stall"),
];
const MOCK_FLOOR: ChoiceType[] = [
  createChoice(1, "Concrete"),
  createChoice(2, "Sand"),
  createChoice(3, "Rubber Mat"),
];
const MOCK_FEED_FREQ: ChoiceType[] = [
  createChoice(1, "Once Daily"),
  createChoice(2, "Twice Daily"),
  createChoice(3, "Ad Libitum"),
];
const MOCK_WATER: ChoiceType[] = [
  createChoice(1, "Borehole"),
  createChoice(2, "River"),
  createChoice(3, "Tap Water"),
];
const MOCK_BREED: ChoiceType[] = [
  createChoice(1, "Holstein"),
  createChoice(2, "Jersey"),
  createChoice(3, "Boran"),
];
const MOCK_GYNE: ChoiceType[] = [
  createChoice(1, "Normal"),
  createChoice(2, "Cystic"),
  createChoice(3, "Anoestrus"),
];
// Health Status Mock
const MOCK_GENERAL_HEALTH: ChoiceType[] = [
  createChoice(1, "Good"),
  createChoice(2, "Fair"),
  createChoice(3, "Poor"),
];
const MOCK_UDDER_HEALTH: ChoiceType[] = [
  createChoice(1, "Healthy"),
  createChoice(2, "Injured"),
  createChoice(3, "Inflamed"),
];
const MOCK_MASTITIS: ChoiceType[] = [
  createChoice(1, "Negative"),
  createChoice(2, "Clinical"),
  createChoice(3, "Sub-clinical"),
];

const MOCK_DOCTORS: StaffMember[] = [
  {
    id: 1,
    name: "Dr. Abebe",
    phone_number: "+251911223344",
    license_number: "LIC-1001",
    specialization: "General Veterinary",
  },
  {
    id: 2,
    name: "Dr. Sara",
    phone_number: "+251922334455",
    license_number: "LIC-1002",
    specialization: "Reproduction Specialist",
  },
];

const MOCK_INSEMINATORS: StaffMember[] = [
  {
    id: 1,
    name: "Kebede T.",
    phone_number: "+251933445566",
    address: "Bishoftu, Zone 1",
  },
  {
    id: 2,
    name: "Mulugeta B.",
    phone_number: "+251944556677",
    address: "Addis Ababa, Bole",
  },
];

const MOCK_FARMS: Farm[] = [
  {
    farm_id: "FARM-001",
    owner_name: "Dawit Kebede",
    address: "Addis Ababa, Bole Sub-city, Woreda 03",
    telephone_number: "+251911556677",
    // Simulating ODK/Kobo format: lat lon alt accuracy
    location_gps: "9.005401 38.763611 2300 4.5",
    fertility_camp_no: 101,
    cluster_number: "C-North",
    total_number_of_cows: 45,
    number_of_calves: 10,
    number_of_milking_cows: 35,
    total_daily_milk: 500,
    type_of_housing: 1,
    type_of_floor: 1,
    main_feed: "Hay and Concentrate",
    rate_of_cow_feeding: 2,
    source_of_water: 3,
    rate_of_water_giving: 3,
    farm_hygiene_score: 4,
    doctor: 1,
    inseminator: 1,
  },
  {
    farm_id: "FARM-002",
    owner_name: "Sarah Smith",
    address: "Oromia, Bishoftu, Kebele 05",
    telephone_number: "+251922445566",
    // Simulating ODK/Kobo format
    location_gps: "8.7506 38.9805 1950 3.2",
    fertility_camp_no: 102,
    cluster_number: "C-East",
    total_number_of_cows: 120,
    number_of_calves: 30,
    number_of_milking_cows: 90,
    total_daily_milk: 1800,
    type_of_housing: 2,
    type_of_floor: 2,
    main_feed: "Silage",
    rate_of_cow_feeding: 3,
    source_of_water: 1,
    rate_of_water_giving: 3,
    farm_hygiene_score: 3,
    doctor: 2,
    inseminator: undefined,
  },
];

// Initial specific mock cows to preserve relationships with medical assessments
const MOCK_COWS: Cow[] = [
  {
    cow_id: "COW-101",
    farm: "FARM-001",
    breed: 1,
    sex: "F",
    date_of_birth: "2022-01-01",
    parity: 1,
    body_weight: 450.5,
    bcs: 3.5,
    gynecological_status: 1,
    lactation_number: 1,
    days_in_milk: 120,
    average_daily_milk: 25.5,
    cow_inseminated_before: true,
    number_of_inseminations: 2,
    status: "Lactating",
    id_or_breed_bull_used: "BULL-X",
    last_calving_date: "2023-12-01",
  },
  {
    cow_id: "COW-102",
    farm: "FARM-001",
    breed: 2,
    sex: "F",
    date_of_birth: "2021-05-15",
    parity: 2,
    body_weight: 400.0,
    bcs: 3.0,
    gynecological_status: 1,
    lactation_number: 2,
    days_in_milk: 200,
    average_daily_milk: 18.0,
    cow_inseminated_before: true,
    number_of_inseminations: 1,
    status: "Pregnant",
    id_or_breed_bull_used: "BULL-Y",
  },
];

// Automatically generate the rest of the cows to match farm totals
MOCK_FARMS.forEach((farm) => {
  const currentCount = MOCK_COWS.filter((c) => c.farm === farm.farm_id).length;
  const needed = farm.total_number_of_cows - currentCount;

  for (let i = 0; i < needed; i++) {
    const isSick = Math.random() < 0.05;
    const isPregnant = Math.random() < 0.25;
    const isLactating = !isSick && !isPregnant;

    MOCK_COWS.push({
      cow_id: `${farm.farm_id.split("-")[1]}-${1000 + i + currentCount}`,
      farm: farm.farm_id,
      breed: Math.floor(Math.random() * 3) + 1,
      sex: "F",
      date_of_birth: "2021-06-15",
      parity: Math.floor(Math.random() * 4),
      body_weight: 450 + Math.random() * 100,
      bcs: Number((2.5 + Math.random() * 2).toFixed(1)),
      gynecological_status: 1,
      lactation_number: Math.floor(Math.random() * 3) + 1,
      days_in_milk: Math.floor(Math.random() * 300),
      average_daily_milk: Number((15 + Math.random() * 20).toFixed(1)),
      cow_inseminated_before: true,
      number_of_inseminations: Math.floor(Math.random() * 3),
      status: isSick ? "Sick" : isPregnant ? "Pregnant" : "Lactating",
    });
  }
});

const MOCK_MEDICAL_ASSESSMENTS: MedicalAssessment[] = [
  {
    id: 1,
    farm: "FARM-001",
    cow: "COW-101",
    assessed_by: 1,
    assessment_date: "2024-03-10",
    is_cow_sick: false,
    general_health: createChoice(1, "Good"),
    udder_health: createChoice(1, "Healthy"),
    mastitis: createChoice(1, "Negative"),
    has_lameness: false,
    body_condition_score: 4,
    reproductive_health: "Normal",
    is_cow_vaccinated: true,
    vaccination_type: "FMD",
    vaccination_date: "2024-01-15",
    has_deworming: true,
    deworming_date: "2024-02-01",
    deworming_type: "Ivermectin",
  },
  {
    id: 2,
    farm: "FARM-001",
    cow: "COW-102",
    assessed_by: 1,
    assessment_date: "2024-03-12",
    is_cow_sick: true,
    sickness_type: "infectious",
    general_health: createChoice(3, "Poor"),
    udder_health: createChoice(3, "Inflamed"),
    mastitis: createChoice(2, "Clinical"),
    has_lameness: true,
    body_condition_score: 2,
    reproductive_health: "Normal",
    is_cow_vaccinated: false,
    has_deworming: false,
    diagnosis: "Acute Mastitis",
    treatment: "Antibiotics",
    prescription: "Penicillin 20ml",
    notes: "Isolate cow immediately.",
  },
];

// Mock reproduction records for heat signs history
const MOCK_REPRODUCTION_RECORDS = [
  {
    id: 1,
    cow: "COW-101",
    heat_sign_start: "2024-03-01T08:00:00",
    heat_signs_seen: "Mucus discharge, Mounting",
  },
  {
    id: 2,
    cow: "COW-101",
    heat_sign_start: "2024-02-08T14:30:00",
    heat_signs_seen: "Restlessness, Bellowing",
  },
  {
    id: 3,
    cow: "COW-102",
    heat_sign_start: "2024-03-15T06:00:00",
    heat_signs_seen: "Standing heat",
  },
];

// -----------------------------------

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const storedAuth = localStorage.getItem("auth_credentials");
    if (storedAuth && !isDemo) {
      const { username, password } = JSON.parse(storedAuth);
      const token = btoa(`${username}:${password}`);
      config.headers.Authorization = `Basic ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !isDemo) {
      localStorage.removeItem("auth_credentials");
      window.location.hash = "#/login";
    }
    return Promise.reject(error);
  }
);

// Helper to handle both paginated and non-paginated responses
const resolveResponseData = (response: any) => {
  if (response.data && Array.isArray(response.data.results)) {
    return response.data.results;
  }
  return response.data;
};

const fetchChoices = async (endpoint: string, mockData: ChoiceType[]) => {
  if (isDemo) return Promise.resolve(mockData);
  const res = await api.get(endpoint);
  return resolveResponseData(res);
};

// Helper to fetch all pages from a paginated endpoint
const fetchAllPages = async <T>(
  endpoint: string,
  params = {}
): Promise<T[]> => {
  let allResults: T[] = [];
  let nextUrl: string | null = endpoint;

  // Handle query params for the first request
  const config = { params };

  while (nextUrl) {
    // For subsequent pages, nextUrl is a full URL, so we need to handle that
    // If it's the first request (endpoint), use the config with params
    // If it's a full URL from 'next', we don't need params as they are in the URL
    const isFullUrl = nextUrl.startsWith("http");
    const urlToFetch = isFullUrl ? nextUrl : nextUrl;
    const requestConfig = isFullUrl ? {} : config;

    const response = await api.get(urlToFetch, requestConfig);
    const data = response.data;

    if (data && Array.isArray(data.results)) {
      allResults = [...allResults, ...data.results];
      nextUrl = data.next;
    } else if (Array.isArray(data)) {
      // If not paginated, just return the data
      return data;
    } else {
      // Unexpected format, stop
      nextUrl = null;
    }
  }

  return allResults;
};

export const DataService = {
  // Updated endpoints to match Django Router (no hyphens)
  getHousingTypes: () => fetchChoices("/housingtypes/", MOCK_HOUSING),
  getFloorTypes: () => fetchChoices("/floortypes/", MOCK_FLOOR),
  getFeedingFrequencies: () =>
    fetchChoices("/feedingfrequencies/", MOCK_FEED_FREQ),
  getWaterSources: () => fetchChoices("/watersources/", MOCK_WATER),
  getBreedTypes: () => fetchChoices("/breedtypes/", MOCK_BREED),
  getGynecologicalStatuses: () =>
    fetchChoices("/gynecologicalstatuses/", MOCK_GYNE),
  getGeneralHealthStatuses: () =>
    fetchChoices("/generalhealthstatuses/", MOCK_GENERAL_HEALTH),
  getUdderHealthStatuses: () =>
    fetchChoices("/udderhealthstatuses/", MOCK_UDDER_HEALTH),
  getMastitisStatuses: () => fetchChoices("/mastitisstatuses/", MOCK_MASTITIS),
};

export const StaffService = {
  getDoctors: async (): Promise<StaffMember[]> => {
    if (isDemo) return Promise.resolve(MOCK_DOCTORS);
    const response = await api.get("/doctors/");
    return resolveResponseData(response);
  },
  getInseminators: async (): Promise<StaffMember[]> => {
    if (isDemo) return Promise.resolve(MOCK_INSEMINATORS);
    const response = await api.get("/inseminators/");
    return resolveResponseData(response);
  },
};

export const FarmService = {
  getAll: async (): Promise<Farm[]> => {
    if (isDemo)
      return new Promise((resolve) =>
        setTimeout(() => resolve([...MOCK_FARMS]), 800)
      );
    // Use fetchAllPages to get ALL farms
    return fetchAllPages<Farm>("/farms/");
  },

  getOne: async (id: string): Promise<Farm> => {
    if (isDemo) {
      const farm = MOCK_FARMS.find((f) => f.farm_id === id);
      return farm
        ? Promise.resolve(farm)
        : Promise.reject(new Error("Farm not found"));
    }

    // Always try filtering by farm_id first since we use farm_id in URLs
    try {
      const response = await api.get(`/farms/`, { params: { farm_id: id } });
      const results = response.data.results || [];
      const farm = results.find((f: Farm) => f.farm_id === id);

      if (farm) return farm;
    } catch (error) {
      console.warn(`Failed to find farm by farm_id: ${id}`, error);
    }

    // Fallback: Try direct PK lookup
    try {
      const response = await api.get(`/farms/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(`Farm with ID ${id} not found`);
    }
  },
  create: async (data: Partial<Farm>): Promise<Farm> => {
    if (isDemo) {
      const newFarm = {
        ...data,
        farm_id: data.farm_id || `FARM-${Math.floor(Math.random() * 1000)}`,
      } as Farm;
      MOCK_FARMS.push(newFarm);
      return new Promise((resolve) => setTimeout(() => resolve(newFarm), 1000));
    }
    const response = await api.post("/farms/", data);
    return response.data;
  },
  update: async (id: string, data: Partial<Farm>) => {
    if (isDemo) return Promise.resolve(data);
    return await api.patch(`/farms/${id}/`, data);
  },
  // Specific endpoints from FarmViewSet actions
  changeDoctor: async (farmId: string, doctorId: number) => {
    if (isDemo) {
      const farm = MOCK_FARMS.find((f) => f.farm_id === farmId);
      if (farm) farm.doctor = doctorId;
      return Promise.resolve({ success: true });
    }
    return await api.post(`/farms/${farmId}/change_doctor/`, {
      doctor_id: doctorId,
    });
  },
  changeInseminator: async (farmId: string, inseminatorId: number) => {
    if (isDemo) {
      const farm = MOCK_FARMS.find((f) => f.farm_id === farmId);
      if (farm) farm.inseminator = inseminatorId;
      return Promise.resolve({ success: true });
    }
    return await api.post(`/farms/${farmId}/change_inseminator/`, {
      inseminator_id: inseminatorId,
    });
  },
  getMedicalAssessments: async (
    farmId: string
  ): Promise<MedicalAssessment[]> => {
    if (isDemo) {
      return Promise.resolve(
        MOCK_MEDICAL_ASSESSMENTS.filter((m) => m.farm === farmId)
      );
    }
    // Updated to use standard MedicalAssessmentViewSet endpoint
    const response = await api.get(`/medical-assessments/`, {
      params: { farm_id: farmId },
    });
    return resolveResponseData(response);
  },
};

export const CowService = {
  getAll: async (): Promise<Cow[]> => {
    if (isDemo)
      return new Promise((resolve) =>
        setTimeout(() => resolve([...MOCK_COWS]), 800)
      );
    // Use fetchAllPages to get ALL cows for client-side filtering and accurate counts
    return fetchAllPages<Cow>("/cows/");
  },

  getOne: async (id: string): Promise<Cow> => {
    if (isDemo) {
      const cow = MOCK_COWS.find(
        (c) => c.cow_id === id || c.id?.toString() === id
      );
      return cow
        ? Promise.resolve(cow)
        : Promise.reject(new Error("Cow not found"));
    }

    // Always try searching by cow_id first since we use cow_id in URLs
    try {
      const response = await api.get(`/cows/`, { params: { search: id } });
      const results = response.data.results || [];
      // Find exact match to avoid partial matches
      const cow = results.find((c: Cow) => c.cow_id === id);
      if (cow) return cow;
    } catch (error) {
      console.warn(`Failed to find cow by cow_id: ${id}`, error);
    }

    // Fallback: Try direct PK lookup
    try {
      const response = await api.get(`/cows/${id}/`);
      return response.data;
    } catch (error) {
      throw new Error(`Cow with ID ${id} not found`);
    }
  },
  create: async (data: Partial<Cow>): Promise<Cow> => {
    if (isDemo) {
      const newCow = { ...data, status: "Healthy" } as Cow;
      MOCK_COWS.push(newCow);
      return new Promise((resolve) => setTimeout(() => resolve(newCow), 1000));
    }
    const response = await api.post("/cows/", data);
    return response.data;
  },
  getMedicalAssessmentsByCow: async (
    cowId: string
  ): Promise<MedicalAssessment[]> => {
    if (isDemo) {
      return Promise.resolve(
        MOCK_MEDICAL_ASSESSMENTS.filter((m) => m.cow === cowId)
      );
    }
    // Updated to use standard MedicalAssessmentViewSet endpoint
    const response = await api.get(`/medical-assessments/`, {
      params: { cow_id: cowId },
    });
    return resolveResponseData(response);
  },
  getReproductionRecords: async (cowId: string) => {
    if (isDemo) {
      return Promise.resolve(
        MOCK_REPRODUCTION_RECORDS.filter((r) => r.cow === cowId)
      );
    }
    // Assuming ReproductionViewSet supports filtering by cow_id, or use the custom endpoint if strictly needed
    // For now, we'll use the standard router endpoint which likely supports filtering
    const response = await api.get(`/reproduction/`, {
      params: { cow_id: cowId },
    });
    return resolveResponseData(response);
  },
};

export default api;
// import axios from 'axios';
// import { LoginCredentials, Farm, Cow, ChoiceType, StaffMember, MedicalAssessment } from '../types';

// export const API_BASE_URL = 'https://apiv3.cowsville-aau-cvma.com/api';

// // --- DEMO MODE / MOCK DATA SETUP ---
// let isDemo = localStorage.getItem('demo_mode') === 'true';

// export const setDemoMode = (enable: boolean) => {
//   isDemo = enable;
//   if (enable) {
//     localStorage.setItem('demo_mode', 'true');
//   } else {
//     localStorage.removeItem('demo_mode');
//   }
// };

// // Helper for mock choices
// const createChoice = (id: number, name: string): ChoiceType => ({ id, name, display_name: name });

// const MOCK_HOUSING: ChoiceType[] = [createChoice(1, 'Barn'), createChoice(2, 'Open Pasture'), createChoice(3, 'Tie Stall')];
// const MOCK_FLOOR: ChoiceType[] = [createChoice(1, 'Concrete'), createChoice(2, 'Sand'), createChoice(3, 'Rubber Mat')];
// const MOCK_FEED_FREQ: ChoiceType[] = [createChoice(1, 'Once Daily'), createChoice(2, 'Twice Daily'), createChoice(3, 'Ad Libitum')];
// const MOCK_WATER: ChoiceType[] = [createChoice(1, 'Borehole'), createChoice(2, 'River'), createChoice(3, 'Tap Water')];
// const MOCK_BREED: ChoiceType[] = [createChoice(1, 'Holstein'), createChoice(2, 'Jersey'), createChoice(3, 'Boran')];
// const MOCK_GYNE: ChoiceType[] = [createChoice(1, 'Normal'), createChoice(2, 'Cystic'), createChoice(3, 'Anoestrus')];
// // Health Status Mock
// const MOCK_GENERAL_HEALTH: ChoiceType[] = [createChoice(1, 'Good'), createChoice(2, 'Fair'), createChoice(3, 'Poor')];
// const MOCK_UDDER_HEALTH: ChoiceType[] = [createChoice(1, 'Healthy'), createChoice(2, 'Injured'), createChoice(3, 'Inflamed')];
// const MOCK_MASTITIS: ChoiceType[] = [createChoice(1, 'Negative'), createChoice(2, 'Clinical'), createChoice(3, 'Sub-clinical')];

// const MOCK_DOCTORS: StaffMember[] = [
//     { id: 1, name: 'Dr. Abebe', phone_number: '+251911223344', license_number: 'LIC-1001', specialization: 'General Veterinary' },
//     { id: 2, name: 'Dr. Sara', phone_number: '+251922334455', license_number: 'LIC-1002', specialization: 'Reproduction Specialist' }
// ];

// const MOCK_INSEMINATORS: StaffMember[] = [
//     { id: 1, name: 'Kebede T.', phone_number: '+251933445566', address: 'Bishoftu, Zone 1' },
//     { id: 2, name: 'Mulugeta B.', phone_number: '+251944556677', address: 'Addis Ababa, Bole' }
// ];

// const MOCK_FARMS: Farm[] = [
//   {
//     farm_id: 'FARM-001',
//     owner_name: 'Dawit Kebede',
//     address: 'Addis Ababa, Bole Sub-city, Woreda 03',
//     telephone_number: '+251911556677',
//     // Simulating ODK/Kobo format: lat lon alt accuracy
//     location_gps: '9.005401 38.763611 2300 4.5',
//     fertility_camp_no: 101,
//     cluster_number: 'C-North',
//     total_number_of_cows: 45,
//     number_of_calves: 10,
//     number_of_milking_cows: 35,
//     total_daily_milk: 500,
//     type_of_housing: 1,
//     type_of_floor: 1,
//     main_feed: 'Hay and Concentrate',
//     rate_of_cow_feeding: 2,
//     source_of_water: 3,
//     rate_of_water_giving: 3,
//     farm_hygiene_score: 4,
//     doctor: 1,
//     inseminator: 1
//   },
//   {
//     farm_id: 'FARM-002',
//     owner_name: 'Sarah Smith',
//     address: 'Oromia, Bishoftu, Kebele 05',
//     telephone_number: '+251922445566',
//     // Simulating ODK/Kobo format
//     location_gps: '8.7506 38.9805 1950 3.2',
//     fertility_camp_no: 102,
//     cluster_number: 'C-East',
//     total_number_of_cows: 120,
//     number_of_calves: 30,
//     number_of_milking_cows: 90,
//     total_daily_milk: 1800,
//     type_of_housing: 2,
//     type_of_floor: 2,
//     main_feed: 'Silage',
//     rate_of_cow_feeding: 3,
//     source_of_water: 1,
//     rate_of_water_giving: 3,
//     farm_hygiene_score: 3,
//     doctor: 2,
//     inseminator: undefined
//   },
// ];

// // Initial specific mock cows to preserve relationships with medical assessments
// const MOCK_COWS: Cow[] = [
//   {
//     cow_id: 'COW-101',
//     farm: 'FARM-001',
//     breed: 1,
//     sex: 'F',
//     date_of_birth: '2022-01-01',
//     parity: 1,
//     body_weight: 450.50,
//     bcs: 3.5,
//     gynecological_status: 1,
//     lactation_number: 1,
//     days_in_milk: 120,
//     average_daily_milk: 25.5,
//     cow_inseminated_before: true,
//     number_of_inseminations: 2,
//     status: 'Lactating',
//     id_or_breed_bull_used: 'BULL-X',
//     last_calving_date: '2023-12-01'
//   },
//   {
//     cow_id: 'COW-102',
//     farm: 'FARM-001',
//     breed: 2,
//     sex: 'F',
//     date_of_birth: '2021-05-15',
//     parity: 2,
//     body_weight: 400.00,
//     bcs: 3.0,
//     gynecological_status: 1,
//     lactation_number: 2,
//     days_in_milk: 200,
//     average_daily_milk: 18.0,
//     cow_inseminated_before: true,
//     number_of_inseminations: 1,
//     status: 'Pregnant',
//     id_or_breed_bull_used: 'BULL-Y'
//   },
// ];

// // Automatically generate the rest of the cows to match farm totals
// MOCK_FARMS.forEach(farm => {
//     const currentCount = MOCK_COWS.filter(c => c.farm === farm.farm_id).length;
//     const needed = farm.total_number_of_cows - currentCount;

//     for(let i = 0; i < needed; i++) {
//         const isSick = Math.random() < 0.05;
//         const isPregnant = Math.random() < 0.25;
//         const isLactating = !isSick && !isPregnant;

//         MOCK_COWS.push({
//             cow_id: `${farm.farm_id.split('-')[1]}-${1000 + i + currentCount}`,
//             farm: farm.farm_id,
//             breed: Math.floor(Math.random() * 3) + 1,
//             sex: 'F',
//             date_of_birth: '2021-06-15',
//             parity: Math.floor(Math.random() * 4),
//             body_weight: 450 + (Math.random() * 100),
//             bcs: Number((2.5 + Math.random() * 2).toFixed(1)),
//             gynecological_status: 1,
//             lactation_number: Math.floor(Math.random() * 3) + 1,
//             days_in_milk: Math.floor(Math.random() * 300),
//             average_daily_milk: Number((15 + Math.random() * 20).toFixed(1)),
//             cow_inseminated_before: true,
//             number_of_inseminations: Math.floor(Math.random() * 3),
//             status: isSick ? 'Sick' : isPregnant ? 'Pregnant' : 'Lactating'
//         });
//     }
// });

// const MOCK_MEDICAL_ASSESSMENTS: MedicalAssessment[] = [
//     {
//         id: 1,
//         farm: 'FARM-001',
//         cow: 'COW-101',
//         assessed_by: 1,
//         assessment_date: '2024-03-10',
//         is_cow_sick: false,
//         general_health: createChoice(1, 'Good'),
//         udder_health: createChoice(1, 'Healthy'),
//         mastitis: createChoice(1, 'Negative'),
//         has_lameness: false,
//         body_condition_score: 4,
//         reproductive_health: 'Normal',
//         is_cow_vaccinated: true,
//         vaccination_type: 'FMD',
//         vaccination_date: '2024-01-15',
//         has_deworming: true,
//         deworming_date: '2024-02-01',
//         deworming_type: 'Ivermectin'
//     },
//     {
//         id: 2,
//         farm: 'FARM-001',
//         cow: 'COW-102',
//         assessed_by: 1,
//         assessment_date: '2024-03-12',
//         is_cow_sick: true,
//         sickness_type: 'infectious',
//         general_health: createChoice(3, 'Poor'),
//         udder_health: createChoice(3, 'Inflamed'),
//         mastitis: createChoice(2, 'Clinical'),
//         has_lameness: true,
//         body_condition_score: 2,
//         reproductive_health: 'Normal',
//         is_cow_vaccinated: false,
//         has_deworming: false,
//         diagnosis: 'Acute Mastitis',
//         treatment: 'Antibiotics',
//         prescription: 'Penicillin 20ml',
//         notes: 'Isolate cow immediately.'
//     }
// ];

// // -----------------------------------

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// api.interceptors.request.use(
//   (config) => {
//     const storedAuth = localStorage.getItem('auth_credentials');
//     if (storedAuth && !isDemo) {
//       const { username, password } = JSON.parse(storedAuth);
//       const token = btoa(`${username}:${password}`);
//       config.headers.Authorization = `Basic ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// api.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (error.response && error.response.status === 401 && !isDemo) {
//       localStorage.removeItem('auth_credentials');
//       window.location.hash = '#/login';
//     }
//     return Promise.reject(error);
//   }
// );

// const fetchChoices = async (endpoint: string, mockData: ChoiceType[]) => {
//     if (isDemo) return Promise.resolve(mockData);
//     const res = await api.get(endpoint);
//     return res.data;
// };

// export const DataService = {
//     getHousingTypes: () => fetchChoices('/housing-types/', MOCK_HOUSING),
//     getFloorTypes: () => fetchChoices('/floor-types/', MOCK_FLOOR),
//     getFeedingFrequencies: () => fetchChoices('/feeding-frequencies/', MOCK_FEED_FREQ),
//     getWaterSources: () => fetchChoices('/water-sources/', MOCK_WATER),
//     getBreedTypes: () => fetchChoices('/breed-types/', MOCK_BREED),
//     getGynecologicalStatuses: () => fetchChoices('/gynecological-statuses/', MOCK_GYNE),
//     getGeneralHealthStatuses: () => fetchChoices('/general-health-statuses/', MOCK_GENERAL_HEALTH),
//     getUdderHealthStatuses: () => fetchChoices('/udder-health-statuses/', MOCK_UDDER_HEALTH),
//     getMastitisStatuses: () => fetchChoices('/mastitis-statuses/', MOCK_MASTITIS),
// };

// export const StaffService = {
//     getDoctors: async (): Promise<StaffMember[]> => {
//         if (isDemo) return Promise.resolve(MOCK_DOCTORS);
//         const response = await api.get('/doctors/');
//         return response.data;
//     },
//     getInseminators: async (): Promise<StaffMember[]> => {
//         if (isDemo) return Promise.resolve(MOCK_INSEMINATORS);
//         const response = await api.get('/inseminators/');
//         return response.data;
//     }
// }

// export const FarmService = {
//   getAll: async (): Promise<Farm[]> => {
//     if (isDemo) return new Promise(resolve => setTimeout(() => resolve([...MOCK_FARMS]), 800));
//     const response = await api.get('/farms/');
//     return response.data;
//   },
//   getOne: async (id: string): Promise<Farm> => {
//     if (isDemo) {
//         const farm = MOCK_FARMS.find(f => f.farm_id === id);
//         return farm ? Promise.resolve(farm) : Promise.reject("Farm not found");
//     }
//     const response = await api.get(`/farms/${id}/`);
//     return response.data;
//   },
//   create: async (data: Partial<Farm>): Promise<Farm> => {
//     if (isDemo) {
//         const newFarm = { ...data, farm_id: data.farm_id || `FARM-${Math.floor(Math.random()*1000)}` } as Farm;
//         MOCK_FARMS.push(newFarm);
//         return new Promise(resolve => setTimeout(() => resolve(newFarm), 1000));
//     }
//     const response = await api.post('/farms/', data);
//     return response.data;
//   },
//   update: async (id: string, data: Partial<Farm>) => {
//       if(isDemo) return Promise.resolve(data);
//       return await api.patch(`/farms/${id}/`, data);
//   },
//   // Specific endpoints from FarmViewSet actions
//   changeDoctor: async (farmId: string, doctorId: number) => {
//       if(isDemo) {
//           const farm = MOCK_FARMS.find(f => f.farm_id === farmId);
//           if(farm) farm.doctor = doctorId;
//           return Promise.resolve({ success: true });
//       }
//       return await api.post(`/farms/${farmId}/change_doctor/`, { doctor_id: doctorId });
//   },
//   changeInseminator: async (farmId: string, inseminatorId: number) => {
//       if(isDemo) {
//           const farm = MOCK_FARMS.find(f => f.farm_id === farmId);
//           if(farm) farm.inseminator = inseminatorId;
//           return Promise.resolve({ success: true });
//       }
//       return await api.post(`/farms/${farmId}/change_inseminator/`, { inseminator_id: inseminatorId });
//   },
//   getMedicalAssessments: async (farmId: string): Promise<MedicalAssessment[]> => {
//       if (isDemo) {
//           return Promise.resolve(MOCK_MEDICAL_ASSESSMENTS.filter(m => m.farm === farmId));
//       }
//       const response = await api.get(`/cows/medical_records/`, { params: { farm_id: farmId, type: 'doctor' } });
//       return response.data;
//   }
// };

// export const CowService = {
//   getAll: async (): Promise<Cow[]> => {
//     if (isDemo) return new Promise(resolve => setTimeout(() => resolve([...MOCK_COWS]), 800));
//     const response = await api.get('/cows/');
//     return response.data;
//   },
//   getOne: async (id: string): Promise<Cow> => {
//     if (isDemo) {
//         const cow = MOCK_COWS.find(c => c.cow_id === id);
//         return cow ? Promise.resolve(cow) : Promise.reject("Cow not found");
//     }
//     const response = await api.get(`/cows/${id}/`);
//     return response.data;
//   },
//   create: async (data: Partial<Cow>): Promise<Cow> => {
//     if (isDemo) {
//         const newCow = { ...data, status: 'Healthy' } as Cow;
//         MOCK_COWS.push(newCow);
//         return new Promise(resolve => setTimeout(() => resolve(newCow), 1000));
//     }
//     const response = await api.post('/cows/', data);
//     return response.data;
//   },
//   getMedicalAssessmentsByCow: async (cowId: string): Promise<MedicalAssessment[]> => {
//       if (isDemo) {
//           return Promise.resolve(MOCK_MEDICAL_ASSESSMENTS.filter(m => m.cow === cowId));
//       }
//       const response = await api.get(`/cows/medical_records/`, { params: { cow_id: cowId, type: 'all' } });
//       return response.data;
//   }
// };

// export default api;
