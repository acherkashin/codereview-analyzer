import { FileUpload } from '@mui/icons-material';
import { Button } from '@mui/material';
import { useRef } from 'react';

export interface FileUploadButtonProps {
  label: string;
  onTextSelected: (text: string) => void;
}

export function ImportTextButton({ label, onTextSelected }: FileUploadButtonProps) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <Button onClick={() => ref.current?.click()} startIcon={<FileUpload />}>
      {label}
      <input
        ref={ref}
        hidden
        accept="application/json"
        type="file"
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
              return;
            }
            onTextSelected(text);
          };
          reader.readAsText(file);
        }}
      />
    </Button>
  );
}
