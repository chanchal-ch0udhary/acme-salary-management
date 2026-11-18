import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Box, Button, Card, InputAdornment, MenuItem, Skeleton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TableSortLabel, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toQuery } from '../api/client';
import { useEmployees, useMeta } from '../api/hooks';
import type { EmployeeFilters } from '../api/types';
import { ErrorAlert, StatusChip } from '../components/common';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { ImportDialog } from '../components/ImportDialog';
import { formatDate, formatMoney, formatUsd } from '../lib/format';
import { useDebounced } from '../lib/useDebounced';

type SortKey = NonNullable<EmployeeFilters['sort_by']>;
const COLUMNS: { key: SortKey | null; label: string; align?: 'right' }[] = [
  { key: 'name', label: 'Employee' },
  { key: 'department', label: 'Department' },
  { key: 'level', label: 'Level' },
  { key: 'country', label: 'Country' },
  { key: 'salary', label: 'Salary (local)', align: 'right' },
  { key: null, label: 'Salary (USD)', align: 'right' },
  { key: 'hire_date', label: 'Hired' },
  { key: null, label: 'Status' },
];

const FILTER_KEYS = ['q', 'country', 'department', 'level', 'status', 'min_salary_usd', 'max_salary_usd'] as const;

/** Filters, sort and page live in the URL, so any view can be bookmarked or shared and survives refresh. */
export function EmployeesPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: meta } = useMeta();
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const urlQ = params.get('q') ?? '';
  const [searchText, setSearchText] = useState(urlQ);
  const debouncedQ = useDebounced(searchText);

  const update = (patch: Record<string, string | undefined>, resetPage = true) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
      if (resetPage) next.delete('page');
      return next;
    }, { replace: true });

  useEffect(() => {
    if (debouncedQ !== urlQ) update({ q: debouncedQ || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const filters: EmployeeFilters = {
    ...Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? undefined])),
    sort_by: (params.get('sort_by') as SortKey) ?? 'name',
    sort_dir: params.get('sort_dir') === 'desc' ? 'desc' : 'asc',
    page: params.get('page') ?? '1',
    page_size: params.get('page_size') ?? '25',
  };
  const { data, isLoading, isFetching, error } = useEmployees(filters);
  const hasFilters = FILTER_KEYS.some((k) => params.get(k));

  const exportHref = `/api/employees/export.csv${toQuery(Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k)])))}`;
  const sort = (key: SortKey) => update({ sort_by: key, sort_dir: filters.sort_by === key && filters.sort_dir === 'asc' ? 'desc' : 'asc' }, false);

  const select = (key: (typeof FILTER_KEYS)[number], label: string, options: { value: string; label: string }[]) => (
    <TextField select size="small" label={label} value={params.get(key) ?? ''} onChange={(e) => update({ [key]: e.target.value || undefined })} sx={{ minWidth: 140 }}>
      <MenuItem value="">All</MenuItem>
      {options.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
    </TextField>
  );

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5">Employees</Typography>
          <Typography variant="body2" color="text.secondary">{data ? `${data.total.toLocaleString()} ${hasFilters ? 'matching' : 'total'}` : ' '}</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button startIcon={<UploadFileIcon />} onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button startIcon={<DownloadIcon />} href={exportHref}>Export CSV</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}>Add employee</Button>
        </Stack>
      </Stack>

      <Card sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" useFlexGap flexWrap="wrap" spacing={1.5} sx={{ '& > *': { mb: 1 } }}>
          <TextField size="small" placeholder="Search name, email or code" value={searchText} onChange={(e) => setSearchText(e.target.value)} sx={{ minWidth: 260 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
          {select('country', 'Country', meta?.countries.map((c) => ({ value: c.code, label: c.name })) ?? [])}
          {select('department', 'Department', meta?.departments.map((d) => ({ value: d, label: d })) ?? [])}
          {select('level', 'Level', meta?.levels.map((l) => ({ value: String(l.level), label: `L${l.level} · ${l.name}` })) ?? [])}
          {select('status', 'Status', [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }])}
          <TextField size="small" type="number" label="Min USD" value={params.get('min_salary_usd') ?? ''} onChange={(e) => update({ min_salary_usd: e.target.value || undefined })} sx={{ width: 120 }} />
          <TextField size="small" type="number" label="Max USD" value={params.get('max_salary_usd') ?? ''} onChange={(e) => update({ max_salary_usd: e.target.value || undefined })} sx={{ width: 120 }} />
          {hasFilters && <Button onClick={() => { setSearchText(''); setParams({}, { replace: true }); }}>Clear</Button>}
        </Stack>
      </Card>

      <ErrorAlert error={error} />
      <Card sx={{ opacity: isFetching && !isLoading ? 0.7 : 1, transition: 'opacity .15s' }}>
        <TableContainer>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {COLUMNS.map((c) => (
                  <TableCell key={c.label} align={c.align} sortDirection={c.key && filters.sort_by === c.key ? filters.sort_dir : false}>
                    {c.key ? <TableSortLabel active={filters.sort_by === c.key} direction={filters.sort_by === c.key ? filters.sort_dir : 'asc'} onClick={() => sort(c.key as SortKey)}>{c.label}</TableSortLabel> : c.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading && Array.from({ length: 8 }, (_, i) => (
                <TableRow key={i}>{COLUMNS.map((c) => <TableCell key={c.label}><Skeleton /></TableCell>)}</TableRow>
              ))}
              {data?.items.map((e) => (
                <TableRow key={e.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/employees/${e.id}`)}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{e.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{e.code} · {e.job_title}</Typography>
                  </TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell>L{e.level}</TableCell>
                  <TableCell>{e.country}</TableCell>
                  <TableCell align="right">{formatMoney(e.salary, e.currency)}</TableCell>
                  <TableCell align="right">{formatUsd(e.salary_usd)}</TableCell>
                  <TableCell>{formatDate(e.hire_date)}</TableCell>
                  <TableCell><StatusChip status={e.status} /></TableCell>
                </TableRow>
              ))}
              {data && data.items.length === 0 && (
                <TableRow><TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6, color: 'text.secondary' }}>No employees match these filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={data?.total ?? 0}
          page={Number(filters.page) - 1}
          rowsPerPage={Number(filters.page_size)}
          rowsPerPageOptions={[10, 25, 50, 100]}
          onPageChange={(_, p) => update({ page: String(p + 1) }, false)}
          onRowsPerPageChange={(e) => update({ page_size: e.target.value })}
        />
      </Card>

      {addOpen && <EmployeeFormDialog open onClose={() => setAddOpen(false)} onCreated={(e) => navigate(`/employees/${e.id}`)} />}
      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}
