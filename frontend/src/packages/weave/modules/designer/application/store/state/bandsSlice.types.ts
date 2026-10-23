import { ReportBand, BandType } from '../../../../band/domain';
import type { ComponentType, ReportComponent } from '../../../../components/common/domain';
import type { GroupedListConfig } from '../../../domain/groupedList';

export interface BandsSlice {
  addBand: (type: BandType, options?: { position?: { x: number; y: number }; dataSource?: string }) => void;
  removeBand: (id: string) => void;
  updateBand: (id: string, updates: Partial<ReportBand>) => void;
  duplicateBand: (id: string) => void;
  /** Lista agrupada: banda de grupos + banda de itens já vinculadas, com título e colunas */
  addGroupedList: (config: GroupedListConfig) => void;
  /** Lista de registros já ligada à fonte, com o campo dentro (campo de lista solto na folha) */
  addListWithField: (dataSource: string, content: string, position?: { x: number; y: number }) => void;
  /** Elemento solto na folha (texto, imagem…): banda invisível do tamanho do componente */
  addElement: (
    type: ComponentType,
    options?: { position?: { x: number; y: number }; initialProps?: Partial<ReportComponent> }
  ) => void;
}
