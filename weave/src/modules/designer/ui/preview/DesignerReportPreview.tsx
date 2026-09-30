import React from 'react';
import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { ReportPreview } from '../../../rendering/ui';
import type { WeavePrintPayload } from '../../../rendering/domain';

interface DesignerReportPreviewProps {
  onClose?: () => void;
  variant?: 'modal' | 'embedded';
  reportId?: string;
  onPrint?: (payload: WeavePrintPayload) => void | Promise<void>;
}

export function DesignerReportPreview(props: DesignerReportPreviewProps) {
  const report = useDesignerStore((state) => state.report);
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
