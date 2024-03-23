import { HostingType, RawData } from '../services/types';
import { splitArrayIntoChunks } from './ArrayUtils';
import { downloadFile } from './FileUtils';

export interface ExportData {
  hostType: HostingType;
  hostUrl: string;
  data: RawData;
}

export function downloadExportData(fileName: string, data: ExportData) {
  const chunkSize = 10_000;
  const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

  if (!isChrome || data!.data.pullRequests.length <= chunkSize) {
    downloadFile(`${fileName}.json`, JSON.stringify(data, null, 2));
  }

  // For Chrome: if there are many pull requests they will be saved in several files due to string limit 600 MB
  // https://stackoverflow.com/questions/72955514/rangeerror-invalid-string-length-at-array-join
  const chunkedArray = splitArrayIntoChunks(data!.data.pullRequests, chunkSize);

  for (let i = 0; i < chunkedArray.length; i++) {
    const name = `${fileName}-${i + 1}.json`;

    downloadFile(
      name,
      JSON.stringify(
        {
          ...data!,
          data: {
            ...data!.data,
            pullRequests: chunkedArray[i],
          },
        },
        null,
        2
      )
    );
  }
}

declare global {
  interface Window {
    chrome: any;
  }
}
