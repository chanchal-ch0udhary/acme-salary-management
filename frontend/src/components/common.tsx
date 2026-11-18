import { Alert, Card, CardContent, Chip, Skeleton, Typography, type ChipProps } from '@mui/material';
import type { ReactNode } from 'react';
import { ApiError } from '../api/client';

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof ApiError ? error.message : 'Something went wrong';
  return (
    <Alert severity="error" sx={{ my: 1 }}>
      {message}
    </Alert>
  );
}

export function StatusChip({ status }: { status: 'active' | 'inactive' }) {
  const color: ChipProps['color'] = status === 'active' ? 'success' : 'default';
  return <Chip size="small" label={status === 'active' ? 'Active' : 'Inactive'} color={color} variant={status === 'active' ? 'filled' : 'outlined'} />;
}

export function KpiCard({ label, value, hint, loading }: { label: string; value: ReactNode; hint?: string; loading?: boolean }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        {loading ? <Skeleton width={110} height={44} /> : <Typography variant="h4">{value}</Typography>}
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function Section({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 8 }}>
          <div>
            <Typography variant="h6">{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </div>
          {action}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
