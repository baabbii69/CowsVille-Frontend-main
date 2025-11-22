
export interface ChoiceType {
  id: number;
  name: string;
  display_name: string;
}

// Mapped from Django Choice Models
export type HousingType = ChoiceType;
export type FloorType = ChoiceType;
export type FeedingFrequency = ChoiceType;
export type WaterSource = ChoiceType;
export type BreedType = ChoiceType;
export type GynecologicalStatus = ChoiceType;
export type GeneralHealthStatus = ChoiceType;
export type UdderHealthStatus = ChoiceType;
export type MastitisStatus = ChoiceType;

export interface StaffMember {
  id: number;
  name: string;
  phone_number: string;
  address?: string;
  specialization?: string; // For doctors
  license_number?: string; // For doctors
  is_active?: boolean; // Added from StaffMember model
}

export interface Farm {
  farm_id: string; // PK
  owner_name: string;
  address: string;
  telephone_number: string;
  location_gps?: string;
  cluster_number?: string;
  fertility_camp_no: number;
  
  // Cow population
  total_number_of_cows: number;
  number_of_calves: number;
  number_of_milking_cows: number;
  total_daily_milk: number;

  // Infrastructure (IDs or Objects depending on fetch depth)
  type_of_housing: number | HousingType;
  type_of_floor: number | FloorType;
  
  // Feeding
  main_feed: string;
  rate_of_cow_feeding: number | FeedingFrequency;
  
  // Water
  source_of_water: number | WaterSource;
  rate_of_water_giving: number | FeedingFrequency;
  
  // Hygiene and Staff
  farm_hygiene_score: 1 | 2 | 3 | 4;
  inseminator?: number | StaffMember | null;
  doctor?: number | StaffMember | null;
  
  is_deleted?: boolean;
}

export interface Cow {
  id?: number; 
  cow_id: string;
  farm: string | Farm;
  breed: number | BreedType;
  
  // Demographics
  date_of_birth?: string;
  sex: 'F' | 'M';
  
  // Health Metrics
  parity: number;
  body_weight: number;
  bcs: number; // DecimalField in Django
  gynecological_status: number | GynecologicalStatus;
  
  // Milk Production
  lactation_number: number;
  days_in_milk: number;
  average_daily_milk: number;
  
  // Reproduction
  cow_inseminated_before: boolean;
  last_date_insemination?: string;
  number_of_inseminations: number;
  id_or_breed_bull_used?: string;
  last_calving_date?: string;
  
  status?: 'Healthy' | 'Sick' | 'Pregnant' | 'Lactating'; // Computed
}

export interface MedicalAssessment {
  id: number;
  farm: string | Farm;
  cow: string | Cow;
  assessed_by: number | StaffMember;
  assessment_date: string;

  // Health Status
  is_cow_sick: boolean;
  sickness_type?: 'infectious' | 'non_infectious' | null;
  general_health: number | ChoiceType;
  udder_health: number | ChoiceType;
  mastitis: number | ChoiceType;
  has_lameness: boolean;
  body_condition_score: number;
  reproductive_health: string;
  metabolic_disease?: string;

  // Vaccination
  is_cow_vaccinated: boolean;
  vaccination_date?: string;
  vaccination_type?: string;

  // Deworming
  has_deworming: boolean;
  deworming_date?: string;
  deworming_type?: string;

  // Assessment Details
  diagnosis?: string;
  treatment?: string;
  prescription?: string;
  next_assessment_date?: string;
  notes?: string;
}

export interface User {
  username: string;
  email?: string;
  role?: 'Admin' | 'Farmer' | 'Doctor';
}

export interface LoginCredentials {
  username: string;
  password: string;
}
