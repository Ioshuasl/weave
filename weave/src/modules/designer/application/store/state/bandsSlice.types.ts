import { ReportBand, BandType } from '../../../../band/domain';

export interface BandsSlice {
  addBand: (type: BandType, options?: { position?: { x: number; y: number } }) => void;
  removeBand: (id: string) => void;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
  duplicateBand: (id: string) => void;
}
