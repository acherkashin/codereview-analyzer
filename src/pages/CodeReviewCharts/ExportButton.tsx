import * as React from 'react';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { downloadFile } from '../../utils/FileUtils';
import { ExportToExcelDialog } from '../../components/dialogs/ExportToExcelDialog';
import { downloadDiscussions } from '../../utils/ExcelUtils';
import { useOpen } from '../../hooks/useOpen';
import { useChartsStore, getDefaultFileName, getExportData, getDiscussions } from '../../stores/ChartsStore';

export interface ExportButtonProps {
  style?: React.CSSProperties;
}

export default function ExportButton({ style }: ExportButtonProps) {
  const excelDialog = useOpen();
  const discussions = useChartsStore(getDiscussions);
  const dataToExport = useChartsStore(getExportData);
  const defaultFileName = useChartsStore(getDefaultFileName)!;

  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }

    setOpen(false);
  };

  const handleDownloadComments = (fileName: string) => {
    downloadDiscussions(fileName, discussions);
    excelDialog.close();
  };

  const handleDownloadJson = () => {
    // TODO: probably need to export selected user
    downloadFile(`${defaultFileName}.json`, JSON.stringify(dataToExport, null, 2));
  };

  return (
    <React.Fragment>
      <Button ref={anchorRef} size="small" variant="contained" style={style} onClick={handleToggle}>
        <FileDownloadIcon />
      </Button>
      <Popper
        sx={{
          zIndex: 1,
        }}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {/* <MenuItem onClick={excelDialog.open}>Export Comments as Excel</MenuItem> */}
                  <MenuItem onClick={excelDialog.open}>Export Discussions as Excel</MenuItem>
                  <MenuItem onClick={handleDownloadJson}>Export as JSON</MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
      <ExportToExcelDialog
        title="Export discussions to excel"
        fieldName="File Name"
        defaultFileName={defaultFileName}
        open={excelDialog.isOpen}
        onClose={excelDialog.close}
        onDownload={handleDownloadComments}
      />
    </React.Fragment>
  );
}
