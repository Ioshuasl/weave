import React from 'react';
import { cn } from '../../../shared/ui/cn';
import { ReportChart } from '../../components/chart/ui';
import {
  getImageOpacity,
  getImageRotation,
  getImageSizeMode,
  resolveReportImageAlt,
  resolveReportImageHref,
  resolveReportImageSrc,
  getImageCropX,
  getImageCropY,
} from '../../components/image/domain';
import { ReportImage } from '../../components/image/ui';
import { ReportQr } from '../../components/qr/ui';
import { escapeHtml, getTextLineHeight, getTextRotation, unescapeHtml } from '../../components/text/domain';
import { FormattedText } from '../../components/text/ui';
import { useDataSourceCatalog } from '../../data-source/ui';
import { evaluateExpression, expandNestedListContent, type SystemVariables } from '../../expression/domain';
import { omitBorderKeys, resolveBorderCssForRender, type ReportComponent } from '../../components/common/domain';
import type { ReportData } from '../../data-source/domain';

interface RenderedComponentProps {
  component: ReportComponent | undefined;
  globalData: ReportData;
  dataContext?: Record<string, unknown>;
  sysContext?: Partial<SystemVariables>;
  /** Banda com altura automática: textos crescem até o fim da linha */
  rowHeight?: number;
}

export const RenderedComponent = React.memo(function RenderedComponent({
  component,
  globalData,
  dataContext,
  sysContext,
  rowHeight,
}: RenderedComponentProps) {
  const dataSourceCatalog = useDataSourceCatalog();

  if (!component) return null;

  const expressionContext = {
    row: dataContext,
    sys: sysContext,
    data: globalData,
    dataSourceCatalog,
  };

  // O valor entra DEPOIS da formatação (negrito/itálico...): senão `**{campo}**` com valor de várias linhas
  // (ou valor com `_`/`**`) quebraria os marcadores. Cada campo é calculado sozinho.
  const renderTextField = (token: string) =>
    escapeHtml(evaluateExpression(unescapeHtml(token), expressionContext));
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
        height:
          rowHeight !== undefined && component.type === 'text'
            ? Math.max(component.rect.height, rowHeight - component.rect.y)
            : component.rect.height,
        ...omitBorderKeys(component.style),
        ...(isText ? { lineHeight: getTextLineHeight(component.style.lineHeight) } : {}),
        ...(isText && getTextRotation(component.textProps) ? { rotate: `${getTextRotation(component.textProps)}deg` } : {}),
        display: 'flex',
        alignItems: isText ? 'flex-start' : isImage || isQr ? 'stretch' : 'center',
        justifyContent: isImage || isQr ? 'stretch' : getJustifyContent(component.style.textAlign),
        overflow: 'hidden',
        whiteSpace: isText ? (component.style.whiteSpace ?? 'normal') : 'nowrap',
        backgroundColor:
          component.style.backgroundColor ||
          (component.type === 'shape' ? '#e5e5e5' : component.type === 'line' ? '#000' : undefined),
        ...resolveBorderCssForRender(component.style, component.type === 'shape' ? '1px solid #000' : undefined),
      }}
    >
      {isText && (
        <FormattedText
          content={expandNestedListContent(component.content, expressionContext)}
          renderField={renderTextField}
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
