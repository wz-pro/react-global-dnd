import React, { ReactNode } from 'react';

import DndLayout, { IDndLayoutProps } from './DndLayout';
import InteractLayer from './InteractLayer';
import { Provider } from './Store';

import './index.less';

export interface DndProps<T> extends IDndLayoutProps<T> {
  children: ReactNode;
  showInteractLayer?: boolean;
}

export default function <T>({
  children,
  showInteractLayer = true,
  ...others
}: DndProps<T>) {
  return (
    <Provider>
      <div className="dnd-root-container">
        <DndLayout<any> {...others}>{children}</DndLayout>
        {showInteractLayer ? <InteractLayer /> : null}
      </div>
    </Provider>
  );
}
