import { downloadReportJson, pickReportJsonFile, readReportJsonFile } from './reportJsonFile';

export const browserReportFileGateway = {
  download: downloadReportJson,
  pick: pickReportJsonFile,
  read: readReportJsonFile,
};
