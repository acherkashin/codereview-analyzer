import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, DialogTitle, IconButton, Typography, Box } from '@mui/material';
import { PullRequest } from '../../services/types';
import { PullRequestList } from '../PullRequestList';

export interface PullRequestDialogProps {
  title: string;
  pullRequests: PullRequest[];
  open: boolean;
  onClose: () => void;
}

export function PullRequestDialog({ open, title, pullRequests, onClose }: PullRequestDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title}
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {pullRequests.length > 0 ? (
          <Box sx={{ mt: 1 }}>
            <PullRequestList pullRequests={pullRequests} />
          </Box>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No pull requests found for this selection.
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
