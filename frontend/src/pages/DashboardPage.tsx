import { Alert, Chip, Grid2 as Grid, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip as MuiTooltip, Typography } from '@mui/material';
import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useBreakdown, useDistribution, useMeta, useOverview, usePayGap } from '../api/hooks';
import type { BreakdownDimension, PayGapDimension } from '../api/types';
import { ErrorAlert, KpiCard, Section } from '../components/common';
import { formatNumber, formatUsd, formatUsdCompact } from '../lib/format';
import { CHART_COLORS } from '../theme';

const DIMENSIONS: { value: BreakdownDimension; label: string }[] = [
  { value: 'country', label: 'Country' },
  { value: 'department', label: 'Department' },
  { value: 'level', label: 'Level' },
  { value: 'job_title', label: 'Job title' },
  { value: 'gender', label: 'Gender' },
];

const GAP_DIMENSIONS: { value: PayGapDimension; label: string }[] = [
  { value: 'overall', label: 'Overall' },
  { value: 'level', label: 'By level' },
  { value: 'department', label: 'By department' },
];

function Toggle<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <ToggleButtonGroup size="small" exclusive value={value} onChange={(_, v: T | null) => v && onChange(v)}>
      {options.map((o) => <ToggleButton key={o.value} value={o.value} sx={{ textTransform: 'none', px: 1.5 }}>{o.label}</ToggleButton>)}
    </ToggleButtonGroup>
  );
}

export function DashboardPage() {
  const overview = useOverview();
  const [dim, setDim] = useState<BreakdownDimension>('country');
  const [gapDim, setGapDim] = useState<PayGapDimension>('level');
  const breakdown = useBreakdown(dim);
  const distribution = useDistribution();
  const payGap = usePayGap(gapDim);
  const { data: meta } = useMeta();
  const o = overview.data;
  const groupLabel = (key: string) => (dim === 'level' ? `L${key}` : key);

  const rows = breakdown.data?.slice(0, dim === 'job_title' ? 15 : undefined) ?? [];
  const histogram = (distribution.data ?? []).map((b) => ({
    label: b.to === null ? `${formatUsdCompact(b.from)}+` : `${formatUsdCompact(b.from)}–${formatUsdCompact(b.to)}`,
    count: b.count,
  }));

  return (
    <>
      <Typography variant="h5" sx={{ mb: 0.5 }}>How does ACME pay its people?</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Active employees only. All figures are annual base salary normalised to USD{meta ? ` using static rates as of ${meta.fx_as_of}` : ''}.
      </Typography>
      <ErrorAlert error={overview.error} />

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Active headcount" loading={!o} value={o && formatNumber(o.count)} hint={o && `${o.countries} countries · ${o.departments} departments`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Annual payroll" loading={!o} value={o && formatUsdCompact(o.total)} hint="Total base salary" /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Median salary" loading={!o} value={o && formatUsd(o.median)} hint={o && `P25 ${formatUsdCompact(o.p25)} · P75 ${formatUsdCompact(o.p75)}`} /></Grid>
        <Grid size={{ xs: 6, md: 3 }}><KpiCard label="Average salary" loading={!o} value={o && formatUsd(o.mean)} hint={o && `Range ${formatUsdCompact(o.min)} – ${formatUsdCompact(o.max)}`} /></Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Section title="Pay by group" subtitle="Median salary with the full spread (USD)" action={<Toggle value={dim} options={DIMENSIONS} onChange={setDim} />}>
            <ErrorAlert error={breakdown.error} />
            {breakdown.isLoading ? <Skeleton variant="rounded" height={260} /> : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={rows} margin={{ left: 8, right: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="key" tickFormatter={groupLabel} interval={0} angle={rows.length > 8 ? -35 : 0} textAnchor={rows.length > 8 ? 'end' : 'middle'} height={rows.length > 8 ? 80 : 30} fontSize={12} />
                    <YAxis tickFormatter={formatUsdCompact} width={60} fontSize={12} />
                    <Tooltip formatter={(v: number) => formatUsd(v)} labelFormatter={groupLabel} />
                    <Bar dataKey="median" name="Median" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <Table size="small" sx={{ mt: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>{DIMENSIONS.find((d) => d.value === dim)?.label}</TableCell>
                      <TableCell align="right">People</TableCell>
                      <TableCell align="right">Min</TableCell>
                      <TableCell align="right">P25</TableCell>
                      <TableCell align="right">Median</TableCell>
                      <TableCell align="right">P75</TableCell>
                      <TableCell align="right">Max</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.key} hover>
                        <TableCell>{groupLabel(r.key)}</TableCell>
                        <TableCell align="right">{formatNumber(r.count)}</TableCell>
                        <TableCell align="right">{formatUsdCompact(r.min)}</TableCell>
                        <TableCell align="right">{formatUsdCompact(r.p25)}</TableCell>
                        <TableCell align="right"><strong>{formatUsdCompact(r.median)}</strong></TableCell>
                        <TableCell align="right">{formatUsdCompact(r.p75)}</TableCell>
                        <TableCell align="right">{formatUsdCompact(r.max)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}
          </Section>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Grid container spacing={2}>
            <Grid size={12}>
              <Section title="Salary distribution" subtitle="Number of employees per USD band">
                {distribution.isLoading ? <Skeleton variant="rounded" height={220} /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={histogram} margin={{ left: 0, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" hide />
                      <YAxis width={44} fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="count" name="Employees" fill={CHART_COLORS.secondary} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Section>
            </Grid>
            <Grid size={12}>
              <Section title="Gender pay gap" subtitle="Median male vs female salary" action={<Toggle value={gapDim} options={GAP_DIMENSIONS} onChange={setGapDim} />}>
                {payGap.isLoading ? <Skeleton variant="rounded" height={160} /> : (
                  <>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Group</TableCell>
                          <TableCell align="right">F / M</TableCell>
                          <TableCell align="right">Median F</TableCell>
                          <TableCell align="right">Median M</TableCell>
                          <TableCell align="right">Gap</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payGap.data?.map((r) => (
                          <TableRow key={r.key}>
                            <TableCell>{gapDim === 'level' ? `L${r.key}` : r.key}</TableCell>
                            <TableCell align="right">{r.female_count} / {r.male_count}</TableCell>
                            <TableCell align="right">{formatUsdCompact(r.female_median)}</TableCell>
                            <TableCell align="right">{formatUsdCompact(r.male_median)}</TableCell>
                            <TableCell align="right">
                              {r.gap_pct === null ? (
                                <MuiTooltip title="Fewer than 5 people in one group, so the gap is not statistically meaningful"><span>n/a</span></MuiTooltip>
                              ) : (
                                <Chip size="small" label={`${r.gap_pct > 0 ? '+' : ''}${r.gap_pct}%`} color={r.gap_pct > 5 ? 'error' : r.gap_pct > 2 ? 'warning' : 'success'} variant="outlined" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <Alert severity="info" sx={{ mt: 1.5 }} icon={false}>
                      Gap = (male − female) / male. Positive means women are paid less. Shown only where each gender has ≥ 5 people. Non-binary / unspecified employees are excluded from this comparison.
                    </Alert>
                  </>
                )}
              </Section>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
