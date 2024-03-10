import CloseIcon from '@mui/icons-material/Close';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';

export interface ExportToExcelDialogProps {
  defaultFileName: string;
  title: string;
  fieldName: string;
  open: boolean;
  onClose: () => void;
  onDownload: (fileName: string) => void;
}

export function ExportToExcelDialog({ open, title, fieldName, defaultFileName, onClose, onDownload }: ExportToExcelDialogProps) {
  const [fileName, setFileName] = useState(defaultFileName);

  useEffect(() => {
    setFileName(defaultFileName);
  }, [defaultFileName, open /** reset filename when dialog opens */]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title}
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
          label={fieldName}
          fullWidth
          variant="standard"
          required
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onDownload(fileName)}>Download</Button>
      </DialogActions>
    </Dialog>
  );
}
