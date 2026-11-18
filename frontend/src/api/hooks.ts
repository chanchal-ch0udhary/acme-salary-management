import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, toQuery } from './client';
import type {
  BreakdownDimension,
  BreakdownRow,
  DistributionBucket,
  Employee,
  EmployeeFilters,
  EmployeeFormValues,
  ImportResult,
  Meta,
  Overview,
  Page,
  PayGapDimension,
  PayGapRow,
  SalaryChange,
} from './types';

export const useMeta = () =>
  useQuery({ queryKey: ['meta'], queryFn: () => api.get<Meta>('/api/meta'), staleTime: Infinity });

export const useEmployees = (filters: EmployeeFilters) =>
  useQuery({
    queryKey: ['employees', 'list', filters],
    queryFn: () => api.get<Page<Employee>>(`/api/employees${toQuery({ ...filters })}`),
    placeholderData: keepPreviousData, // no flicker while paging/filtering
  });

export const useEmployee = (id: number) =>
  useQuery({ queryKey: ['employees', id], queryFn: () => api.get<Employee>(`/api/employees/${id}`) });

export const useSalaryHistory = (id: number) =>
  useQuery({ queryKey: ['employees', id, 'history'], queryFn: () => api.get<SalaryChange[]>(`/api/employees/${id}/salary_history`) });

export const useOverview = () => useQuery({ queryKey: ['insights', 'overview'], queryFn: () => api.get<Overview>('/api/insights/overview') });

export const useBreakdown = (by: BreakdownDimension) =>
  useQuery({
    queryKey: ['insights', 'breakdown', by],
    queryFn: () => api.get<{ rows: BreakdownRow[] }>(`/api/insights/breakdown?by=${by}`).then((r) => r.rows),
    placeholderData: keepPreviousData,
  });

export const useDistribution = () =>
  useQuery({
    queryKey: ['insights', 'distribution'],
    queryFn: () => api.get<{ buckets: DistributionBucket[] }>('/api/insights/distribution').then((r) => r.buckets),
  });

export const usePayGap = (by: PayGapDimension) =>
  useQuery({
    queryKey: ['insights', 'pay-gap', by],
    queryFn: () => api.get<{ rows: PayGapRow[] }>(`/api/insights/pay_gap?by=${by}`).then((r) => r.rows),
    placeholderData: keepPreviousData,
  });

/** Any write can change both lists and aggregates, so invalidate both families. */
function useInvalidate() {
  const qc = useQueryClient();
  return () => Promise.all([qc.invalidateQueries({ queryKey: ['employees'] }), qc.invalidateQueries({ queryKey: ['insights'] })]);
}

export function useCreateEmployee() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: EmployeeFormValues) => api.post<Employee>('/api/employees', { ...v, gender: v.gender || null }),
    onSuccess: invalidate,
  });
}

export function useUpdateEmployee(id: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (patch: Partial<Omit<EmployeeFormValues, 'country' | 'salary'>> & { status?: 'active' | 'inactive' }) =>
      api.patch<Employee>(`/api/employees/${id}`, patch.gender === '' ? { ...patch, gender: null } : patch),
    onSuccess: invalidate,
  });
}

export function useChangeSalary(id: number) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (v: { new_salary: number; effective_date: string; reason: string }) =>
      api.post<Employee>(`/api/employees/${id}/salary`, v),
    onSuccess: invalidate,
  });
}

export function useImportCsv() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (csv: string) => api.postCsv<ImportResult>('/api/employees/import', csv),
    onSuccess: invalidate,
  });
}
