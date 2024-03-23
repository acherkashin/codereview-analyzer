import { useState, useRef } from 'react';
import Button from '@mui/material/Button';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Grow from '@mui/material/Grow';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import { ExportToExcelDialog } from '../../components/dialogs/ExportToExcelDialog';
import { downloadDiscussions } from '../../utils/ExcelUtils';
import { getDiscussions, useChartsStore, getDefaultFileName, getExportData } from '../../stores/ChartsStore';
import { downloadExportData } from '../../utils/ExportDataUtils';

export interface ExportButtonProps {
  style?: React.CSSProperties;
}

enum ExportType {
  ExcelDiscussions,
  Json,
}

export default function ExportButton({ style }: ExportButtonProps) {
  const discussions = useChartsStore(getDiscussions);
  const [exportType, setExportType] = useState<ExportType | null>();
  const dataToExport = useChartsStore(getExportData);
  const defaultFileName = useChartsStore(getDefaultFileName)!;

  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: MouseEvent | TouchEvent) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as Node)) {
      return;
    }

    setOpen(false);
  };

  const handleExport = (fileName: string) => {
    switch (exportType) {
      case ExportType.ExcelDiscussions:
        downloadDiscussions(fileName, discussions);
        break;
      case ExportType.Json:
        downloadExportData(fileName, dataToExport!);
        break;
      default:
        alert('unknown export type');
    }
  };

  return (
    <>
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
                  <MenuItem onClick={() => setExportType(ExportType.ExcelDiscussions)}>Export Discussions as Excel</MenuItem>
                  <MenuItem onClick={() => setExportType(ExportType.Json)}>Export as JSON</MenuItem>
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
        open={exportType != null}
        onClose={() => setExportType(null)}
        onDownload={handleExport}
      />
    </>
  );
}
