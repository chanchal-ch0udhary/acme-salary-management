import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { useChangeSalary } from '../api/hooks';
import type { Employee } from '../api/types';
import { ApiError } from '../api/client';
import { formatMoney, formatPct, salaryDeltaPct, todayIso } from '../lib/format';

interface Props {
  employee: Employee;
  open: boolean;
  onClose: () => void;
}

/** Salary is changed through this dialog only: it forces an effective date and a reason for the audit trail. */
export function SalaryChangeDialog({ employee, open, onClose }: Props) {
  const mutation = useChangeSalary(employee.id);
  const [amountText, setNewSalary] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(todayIso());
  const [reason, setReason] = useState('');

  const amount = Number(amountText);
  const validAmount = Number.isInteger(amount) && amount > 0;
  const delta = validAmount ? salaryDeltaPct(employee.salary, amount) : null;
  const canSubmit = validAmount && amount !== employee.salary && reason.trim().length >= 3 && !mutation.isPending;
  const fieldErrors = mutation.error instanceof ApiError ? mutation.error.fieldErrors : {};

  const submit = () =>
    mutation.mutate(
      { new_salary: amount, effective_date: effectiveDate, reason: reason.trim() },
      { onSuccess: () => { setNewSalary(''); setReason(''); onClose(); } },
    );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Change salary · {employee.full_name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Current: <strong>{formatMoney(employee.salary, employee.currency)}</strong> / year
          </Typography>
          <TextField
            label={`New annual salary (${employee.currency})`}
            value={amountText}
            onChange={(e) => setNewSalary(e.target.value.replace(/[^\d]/g, ''))}
            inputMode="numeric"
            autoFocus
            error={!!fieldErrors.new_salary}
            helperText={fieldErrors.new_salary ?? (delta !== null ? `${formatPct(delta)} vs current` : ' ')}
            InputProps={{ startAdornment: <InputAdornment position="start">{employee.currency}</InputAdornment> }}
          />
          <TextField
            type="date"
            label="Effective date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            error={!!fieldErrors.effective_date}
            helperText={fieldErrors.effective_date}
          />
          <TextField
            label="Reason"
            placeholder="e.g. Annual review, Promotion"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            error={!!fieldErrors.reason}
            helperText={fieldErrors.reason ?? 'Recorded in the audit history'}
          />
          {mutation.error && <Alert severity="error">{mutation.error.message}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!canSubmit}>
          Save change
        </Button>
      </DialogActions>
    </Dialog>
  );
}
