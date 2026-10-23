import React, { useMemo } from 'react';
import { expandCalculos } from '../../../expression/domain';
import { ReportPreview } from '../../../rendering/ui';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import type { WeavePrintPayload } from '../../../rendering/domain';

interface DesignerReportPreviewProps {
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  reportId?: string;
  onPrint?: (payload: WeavePrintPayload) => void | Promise<void>;
}

export function DesignerReportPreview(props: DesignerReportPreviewProps) {
  const designReport = useDesignerStore((state) => state.report);
  const report = useMemo(() => expandCalculos(designReport), [designReport]);
  const data = useDesignerStore((state) => state.data);
  const setPreviewModalOpen = useDesignerStore((state) => state.setPreviewModalOpen);

  return (
    <ReportPreview
      {...props}
      report={report}
      data={data}
      onOpenChange={setPreviewModalOpen}
    />
  );
}
