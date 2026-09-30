import React from 'react';

import { useDesignerStore } from '../../application/store/DesignerStoreContext';
import { getPageContentSize } from '../../../page/domain';
import { getReportPage } from '../../../report/domain';



const GUIDE_COLOR = 'rgba(14, 165, 233, 0.9)';



/** Linhas guia de alinhamento durante arrasto no canvas */

export const AlignmentGuidesOverlay = React.memo(function AlignmentGuidesOverlay() {

  const guides = useDesignerStore((state) => state.activeSnapGuides);

  const contentWidth = useDesignerStore((state) => {
    const page = getReportPage(state.report, state.activePageId);
    return page ? getPageContentSize(page).width : 0;
  });

  const contentHeight = useDesignerStore((state) => {
    const page = getReportPage(state.report, state.activePageId);
    return page ? getPageContentSize(page).height : 0;
  });



  if (!guides || (guides.vertical.length === 0 && guides.horizontal.length === 0)) {

    return null;

  }



  return (

    <div

      className="absolute inset-0 z-[9999] pointer-events-none"

      aria-hidden

    >

      {guides.vertical.map((x) => (

        <div

          key={`v-${x}`}

          className="absolute top-0 pointer-events-none"

          style={{

            left: x,

            width: 1,

            height: contentHeight,

            backgroundColor: GUIDE_COLOR,

            boxShadow: '0 0 0 0.5px rgba(14, 165, 233, 0.4)',

          }}

        />

      ))}

      {guides.horizontal.map((y) => (

        <div

          key={`h-${y}`}

          className="absolute left-0 pointer-events-none"

          style={{

            top: y,

            width: contentWidth,

            height: 1,

            backgroundColor: GUIDE_COLOR,

            boxShadow: '0 0 0 0.5px rgba(14, 165, 233, 0.4)',

          }}

        />

      ))}

    </div>

  );

});


