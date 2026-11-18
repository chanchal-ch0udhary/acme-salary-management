export interface Employee {
  id: number;
  code: string;
  full_name: string;
  email: string;
  gender: 'F' | 'M' | 'X' | null;
  department: string;
  job_title: string;
  level: number;
  country: string;
  currency: string;
  salary: number;
  salary_usd: number;
  hire_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface SalaryChange {
  id: number;
  employee_id: number;
  old_salary: number | null;
  new_salary: number;
  currency: string;
  effective_date: string;
  reason: string;
  created_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Meta {
  countries: { code: string; name: string; currency: string }[];
  departments: string[];
  levels: { level: number; name: string }[];
  genders: string[];
  fx_as_of: string;
}

export interface Summary {
  count: number;
  total: number;
  min: number;
  p25: number;
  median: number;
  mean: number;
  p75: number;
  max: number;
}
export interface Overview extends Summary {
  countries: number;
  departments: number;
}
export interface BreakdownRow extends Summary {
  key: string;
}
export type BreakdownDimension = 'country' | 'department' | 'level' | 'job_title' | 'gender';
export interface DistributionBucket {
  from: number;
  to: number | null;
  count: number;
}
export interface PayGapRow {
  key: string;
  female_count: number;
  male_count: number;
  female_median: number;
  male_median: number;
  gap_pct: number | null;
}
export type PayGapDimension = 'overall' | 'level' | 'department';

export interface ImportResult {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
}

export interface EmployeeFilters {
  q?: string;
  country?: string;
  department?: string;
  level?: string;
  status?: string;
  min_salary_usd?: string;
  max_salary_usd?: string;
  sort_by?: 'name' | 'salary' | 'hire_date' | 'country' | 'department' | 'level';
  sort_dir?: 'asc' | 'desc';
  page?: string;
  page_size?: string;
}

export interface EmployeeFormValues {
  full_name: string;
  email: string;
  gender: string;
  department: string;
  job_title: string;
  level: number;
  country: string;
  salary: number;
  hire_date: string;
}
