export function downloadFile(fileName: string, content: string) {
  const file = new File([content], fileName, {
    type: 'text/plain',
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(file);

  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
