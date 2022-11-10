import CloseIcon from '@mui/icons-material/Close';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export interface ExportToExcelDialogProps {
  open: boolean;
  onClose: () => void;
  onDownload: (fileName: string) => void;
}

export function ExportToExcelDialog({ open, onClose, onDownload }: ExportToExcelDialogProps) {
  const [fileName, setFileName] = useState('');

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Export comments to excel
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          id="name"
          label="File Name"
          fullWidth
          variant="standard"
          required
          onChange={(e) => setFileName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onDownload(fileName)}>Download</Button>
      </DialogActions>
    </Dialog>
  );
}
