import UploadFileIcon from '@mui/icons-material/UploadFile';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, List, ListItem, ListItemText, Typography } from '@mui/material';
import { useRef } from 'react';
import { useImportCsv } from '../api/hooks';

const TEMPLATE = 'full_name,email,gender,department,job_title,level,country,salary,hire_date\nAsha Verma,asha.verma@acme.example,F,Engineering,Software Engineer,3,IN,2400000,2022-04-01\n';

export function ImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const mutation = useImportCsv();
  const result = mutation.data;

  const onFile = async (file: File | undefined) => {
    if (file) mutation.mutate(await file.text());
  };
  const close = () => { mutation.reset(); onClose(); };
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`;

  return (
    <Dialog open={open} onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Import employees from CSV</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Columns: full_name, email, gender (optional), department, job_title, level, country (ISO code), salary (whole local currency units), hire_date (YYYY-MM-DD).
          Valid rows are imported; invalid rows are listed so you can fix and re-upload them. <a href={templateHref} download="employees-template.csv">Download template</a>
        </Typography>
        <input ref={input} type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0])} data-testid="csv-input" />
        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => input.current?.click()} disabled={mutation.isPending}>
          {mutation.isPending ? 'Importing…' : 'Choose CSV file'}
        </Button>
        {mutation.error && <Alert severity="error" sx={{ mt: 2 }}>{mutation.error.message}</Alert>}
        {result && (
          <>
            <Alert severity={result.failed ? 'warning' : 'success'} sx={{ mt: 2 }}>
              Imported {result.imported} employee{result.imported === 1 ? '' : 's'}; {result.failed} row{result.failed === 1 ? '' : 's'} skipped.
            </Alert>
            {result.errors.length > 0 && (
              <List dense sx={{ maxHeight: 220, overflow: 'auto' }}>
                {result.errors.map((e) => (
                  <ListItem key={`${e.row}-${e.message}`}><ListItemText primary={`Row ${e.row}`} secondary={e.message} /></ListItem>
                ))}
              </List>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions><Button onClick={close}>Close</Button></DialogActions>
    </Dialog>
  );
}
