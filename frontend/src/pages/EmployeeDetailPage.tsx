import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import PaidIcon from '@mui/icons-material/Paid';
import { Alert, Box, Button, Card, CardContent, Chip, Grid2 as Grid, Skeleton, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { useEmployee, useMeta, useSalaryHistory, useUpdateEmployee } from '../api/hooks';
import { ErrorAlert, Section, StatusChip } from '../components/common';
import { EmployeeFormDialog } from '../components/EmployeeFormDialog';
import { SalaryChangeDialog } from '../components/SalaryChangeDialog';
import { formatDate, formatMoney, formatPct, formatUsd, salaryDeltaPct } from '../lib/format';

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );
}

export function EmployeeDetailPage() {
  const id = Number(useParams().id);
  const { data: e, isLoading, error } = useEmployee(id);
  const history = useSalaryHistory(id);
  const { data: meta } = useMeta();
  const setStatus = useUpdateEmployee(id);
  const [editOpen, setEditOpen] = useState(false);
  const [salaryOpen, setSalaryOpen] = useState(false);

  if (error instanceof ApiError && error.status === 404) return <Alert severity="warning">Employee not found. <RouterLink to="/employees">Back to list</RouterLink></Alert>;
  if (error) return <ErrorAlert error={error} />;
  if (isLoading || !e) return <Skeleton variant="rounded" height={320} />;

  const countryName = meta?.countries.find((c) => c.code === e.country)?.name ?? e.country;
  const levelName = meta?.levels.find((l) => l.level === e.level)?.name;

  return (
    <>
      <Button component={RouterLink} to="/employees" startIcon={<ArrowBackIcon />} sx={{ mb: 1 }}>All employees</Button>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h4">{e.full_name}</Typography>
            <StatusChip status={e.status} />
          </Stack>
          <Typography color="text.secondary">{e.job_title} · {e.department} · {e.code}</Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>Edit</Button>
          <Button variant="outlined" color={e.status === 'active' ? 'warning' : 'success'} disabled={setStatus.isPending} onClick={() => setStatus.mutate({ status: e.status === 'active' ? 'inactive' : 'active' })}>
            {e.status === 'active' ? 'Deactivate' : 'Reactivate'}
          </Button>
          <Button variant="contained" startIcon={<PaidIcon />} disabled={e.status !== 'active'} onClick={() => setSalaryOpen(true)}>Change salary</Button>
        </Stack>
      </Stack>
      <ErrorAlert error={setStatus.error} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent>
              <Typography variant="overline" sx={{ opacity: 0.8 }}>Current annual salary</Typography>
              <Typography variant="h4">{formatMoney(e.salary, e.currency)}</Typography>
              <Typography sx={{ opacity: 0.85 }}>≈ {formatUsd(e.salary_usd)} USD</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Section title="Profile">
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 4 }}><Fact label="Email" value={e.email} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><Fact label="Country" value={`${countryName} (${e.currency})`} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><Fact label="Level" value={`L${e.level}${levelName ? ` · ${levelName}` : ''}`} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><Fact label="Hired" value={formatDate(e.hire_date)} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><Fact label="Gender" value={e.gender ?? 'Not specified'} /></Grid>
              <Grid size={{ xs: 6, sm: 4 }}><Fact label="Last updated" value={formatDate(e.updated_at)} /></Grid>
            </Grid>
          </Section>
        </Grid>
        <Grid size={12}>
          <Section title="Salary history" subtitle="Every change with who-why-when, newest first">
            {history.isLoading ? <Skeleton variant="rounded" height={120} /> : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Effective</TableCell>
                    <TableCell align="right">From</TableCell>
                    <TableCell align="right">To</TableCell>
                    <TableCell align="right">Change</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.data?.map((h) => {
                    const delta = salaryDeltaPct(h.old_salary, h.new_salary);
                    return (
                      <TableRow key={h.id}>
                        <TableCell>{formatDate(h.effective_date)}</TableCell>
                        <TableCell align="right">{h.old_salary === null ? '—' : formatMoney(h.old_salary, h.currency)}</TableCell>
                        <TableCell align="right">{formatMoney(h.new_salary, h.currency)}</TableCell>
                        <TableCell align="right">{delta === null ? <Chip size="small" label="Start" /> : <Chip size="small" variant="outlined" color={delta >= 0 ? 'success' : 'error'} label={formatPct(delta)} />}</TableCell>
                        <TableCell>{h.reason}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Section>
        </Grid>
      </Grid>

      {editOpen && <EmployeeFormDialog open employee={e} onClose={() => setEditOpen(false)} />}
      {salaryOpen && <SalaryChangeDialog open employee={e} onClose={() => setSalaryOpen(false)} />}
    </>
  );
}
