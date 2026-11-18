import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid2 as Grid, InputAdornment, MenuItem, TextField } from '@mui/material';
import { useState } from 'react';
import { ApiError } from '../api/client';
import { useCreateEmployee, useMeta, useUpdateEmployee } from '../api/hooks';
import type { Employee, EmployeeFormValues } from '../api/types';

interface Props {
  open: boolean;
  onClose: () => void;
  /** When provided the dialog edits this employee (country & salary are read-only here). */
  employee?: Employee;
  onCreated?: (e: Employee) => void;
}

const blank: EmployeeFormValues = {
  full_name: '', email: '', gender: '', department: 'Engineering', job_title: '', level: 2, country: 'US', salary: 0, hire_date: new Date().toISOString().slice(0, 10),
};

const fromEmployee = (e: Employee): EmployeeFormValues => ({
  full_name: e.full_name, email: e.email, gender: e.gender ?? '', department: e.department, job_title: e.job_title, level: e.level, country: e.country, salary: e.salary, hire_date: e.hire_date,
});

export function EmployeeFormDialog({ open, onClose, employee, onCreated }: Props) {
  const { data: meta } = useMeta();
  const create = useCreateEmployee();
  const update = useUpdateEmployee(employee?.id ?? 0);
  const mutation = employee ? update : create;
  const [values, setValues] = useState<EmployeeFormValues>(employee ? fromEmployee(employee) : blank);
  const isEdit = !!employee;
  const currency = meta?.countries.find((c) => c.code === values.country)?.currency ?? '';
  const errors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {};

  const set = <K extends keyof EmployeeFormValues>(key: K, value: EmployeeFormValues[K]) => setValues((v) => ({ ...v, [key]: value }));
  const canSubmit = values.full_name.trim().length >= 2 && values.email.includes('@') && values.job_title.trim().length >= 2 && (isEdit || values.salary > 0) && !mutation.isPending;

  const submit = () => {
    if (employee) {
      const { country: _c, salary: _s, ...patch } = values;
      update.mutate(patch, { onSuccess: onClose });
    } else {
      create.mutate(values, { onSuccess: (e) => { onCreated?.(e); setValues(blank); onClose(); } });
    }
  };

  const field = (key: keyof EmployeeFormValues) => ({ error: !!errors[key], helperText: errors[key] });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? `Edit ${employee.full_name}` : 'Add employee'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Full name" value={values.full_name} onChange={(e) => set('full_name', e.target.value)} {...field('full_name')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} {...field('email')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Department" value={values.department} onChange={(e) => set('department', e.target.value)}>
              {meta?.departments.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Job title" value={values.job_title} onChange={(e) => set('job_title', e.target.value)} {...field('job_title')} />
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField select fullWidth label="Level" value={values.level} onChange={(e) => set('level', Number(e.target.value))}>
              {meta?.levels.map((l) => <MenuItem key={l.level} value={l.level}>L{l.level} · {l.name}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 6, sm: 4 }}>
            <TextField select fullWidth label="Gender (optional)" value={values.gender} onChange={(e) => set('gender', e.target.value)}>
              <MenuItem value="">Not specified</MenuItem>
              <MenuItem value="F">Female</MenuItem>
              <MenuItem value="M">Male</MenuItem>
              <MenuItem value="X">Non-binary</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField fullWidth type="date" label="Hire date" InputLabelProps={{ shrink: true }} value={values.hire_date} onChange={(e) => set('hire_date', e.target.value)} {...field('hire_date')} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField select fullWidth label="Country" disabled={isEdit} value={values.country} onChange={(e) => set('country', e.target.value)} helperText={isEdit ? 'Country is fixed after creation' : undefined}>
              {meta?.countries.map((c) => <MenuItem key={c.code} value={c.code}>{c.name} ({c.currency})</MenuItem>)}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Annual salary"
              disabled={isEdit}
              value={values.salary || ''}
              onChange={(e) => set('salary', Number(e.target.value.replace(/[^\d]/g, '')))}
              inputMode="numeric"
              InputProps={{ startAdornment: <InputAdornment position="start">{currency}</InputAdornment> }}
              error={!!errors.salary}
              helperText={errors.salary ?? (isEdit ? 'Use “Change salary” to keep an audit trail' : undefined)}
            />
          </Grid>
          {mutation.error && !Object.keys(errors).length && (
            <Grid size={12}><Alert severity="error">{mutation.error.message}</Alert></Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit}>{isEdit ? 'Save' : 'Add employee'}</Button>
      </DialogActions>
    </Dialog>
  );
}
