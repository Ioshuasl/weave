import React from 'react';
import { useDataSourceCatalog } from '../designer/designerHostContext';
import { evaluateExpression } from '../../utils/reportUtils';
import type { SystemVariables } from '../../utils/systemVariables';
import { useDesignerStore } from '../../store/designerStore';
import { ReportChart } from '../ReportChart';
import { FormattedText } from '../FormattedText';
import { ReportImage } from '../ReportImage';
import { cn } from '../../utils/cn';
import { getImageOpacity, getImageRotation, getImageSizeMode, resolveReportImageAlt, resolveReportImageHref, resolveReportImageSrc } from '../../utils/imagePropsUtils';
import { getImageCropX, getImageCropY } from '../../utils/imageCropUtils';
import { ReportQr } from '../ReportQr';

interface RenderedComponentProps {
  componentId: string;
  dataContext?: Record<string, unknown>;
  sysContext?: Partial<SystemVariables>;
}

export const RenderedComponent = React.memo(function RenderedComponent({
  componentId,
  dataContext,
  sysContext,
}: RenderedComponentProps) {
  const component = useDesignerStore((state) => state.report.components[componentId]);
  const globalData = useDesignerStore((state) => state.data);
  const dataSourceCatalog = useDataSourceCatalog();

  if (!component) return null;

  const expressionContext = {
    row: dataContext,
    sys: sysContext,
    data: globalData,
    dataSourceCatalog,
  };

  const text =
    component.type === 'text'
      ? evaluateExpression(component.content, expressionContext)
      : '';
  const imageUrl =
    component.type === 'image'
      ? resolveReportImageSrc(component.content, expressionContext)
      : '';
  const imageSizeMode = getImageSizeMode(component.imageProps);
  const imageAlt =
    component.type === 'image'
      ? resolveReportImageAlt(component.imageProps?.alt, expressionContext)
      : '';
  const imageHref =
    component.type === 'image'
      ? resolveReportImageHref(component.imageProps?.href, expressionContext)
      : '';

  const getJustifyContent = (textAlign?: React.CSSProperties['textAlign']) => {
    switch (textAlign) {
      case 'center':
        return 'center';
      case 'right':
        return 'flex-end';
      default:
        return 'flex-start';
    }
  };

  const finalChartData =
    component.type === 'chart' && component.chartProps
      ? globalData[component.chartProps.dataset] || []
      : [];

  const isText = component.type === 'text';
  const isQr = component.type === 'qr';
  const isImage = component.type === 'image';

  return (
    <div
      className={cn(isText && 'hide-scrollbar')}
      style={{
        position: 'absolute',
        left: component.rect.x,
        top: component.rect.y,
        width: component.rect.width,
        height: component.rect.height,
        ...component.style,
        display: 'flex',
        alignItems: isText ? 'flex-start' : isImage || isQr ? 'stretch' : 'center',
        justifyContent: isImage || isQr ? 'stretch' : getJustifyContent(component.style.textAlign),
        overflow: 'hidden',
        whiteSpace: isText ? 'normal' : 'nowrap',
        backgroundColor:
          component.style.backgroundColor ||
          (component.type === 'shape' ? '#e5e5e5' : component.type === 'line' ? '#000' : undefined),
        border:
          component.style.border ||
          (component.type === 'shape' ? '1px solid #000' : undefined),
      }}
    >
      {isText && (
        <FormattedText
          content={text}
          className="w-full break-words"
          style={{ color: component.style.color, fontSize: component.style.fontSize }}
        />
      )}
      {component.type === 'image' && (
        <ReportImage
          src={imageUrl}
          sizeMode={imageSizeMode}
          cropX={getImageCropX(component.imageProps)}
          cropY={getImageCropY(component.imageProps)}
          opacity={getImageOpacity(component.imageProps)}
          rotation={getImageRotation(component.imageProps)}
          href={imageHref}
          interactive
          alt={imageAlt}
        />
      )}
      {component.type === 'qr' && (
        <ReportQr
          value={evaluateExpression(component.content, expressionContext)}
          width={component.rect.width}
          height={component.rect.height}
          qrProps={component.qrProps}
        />
      )}
      {component.type === 'table' && component.tableProps && (
        <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          {component.tableProps.columnWidths?.length ? (
            <colgroup>
              {component.tableProps.columnWidths.map((w, i) => (
                <col key={i} style={{ width: w }} />
              ))}
            </colgroup>
          ) : null}
          <tbody>
            {component.tableProps.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    style={{
                      border: '1px solid #999',
                      padding: '4px',
                      overflow: 'hidden',
                      ...component.style,
                      position: undefined,
                      width: undefined,
                      height: undefined,
                      display: undefined,
                      backgroundColor:
                        component.tableProps?.hasHeader && rowIndex === 0
                          ? '#f5f5f5'
                          : component.style.backgroundColor,
                      fontWeight:
                        component.tableProps?.hasHeader && rowIndex === 0
                          ? 'bold'
                          : component.style.fontWeight,
                    }}
                  >
                    {evaluateExpression(cell, expressionContext)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {component.type === 'chart' && component.chartProps && (
        <ReportChart
          className="absolute inset-0"
          data={finalChartData}
          chartProps={component.chartProps}
          width={component.rect.width}
          height={component.rect.height}
          reportData={globalData}
          dataSourceCatalog={dataSourceCatalog}
        />
      )}
    </div>
  );
});
