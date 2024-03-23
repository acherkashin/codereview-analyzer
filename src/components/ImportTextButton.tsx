import { FileUpload } from '@mui/icons-material';
import { Button } from '@mui/material';

export interface FileUploadButtonProps {
  label: string;
  onTextSelected: (text: string) => void;
}

export function ImportTextButton({ label, onTextSelected }: FileUploadButtonProps) {
  return (
    <Button component="label" startIcon={<FileUpload />}>
      {label}
      <input
        accept="application/json"
        type="file"
        hidden
        onChange={(e) => {
          const input = e.target;
          const file = input.files?.[0];

          if (!file) {
            return;
          }

          const reader = new FileReader();
          reader.onload = function () {
            const text = reader.result as string;
            if (!text) {
              //TODO: need to show error. probably file is too big
              return;
            }
            onTextSelected(text);
          };
          reader.onerror = function () {
            console.error(reader.error);
          };
          reader.readAsText(file);
        }}
      />
    </Button>
  );
}
