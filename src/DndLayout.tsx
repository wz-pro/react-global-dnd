import {
  CSSProperties,
  ReactNode,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useDndContext } from './Store';

import './index.less';

export const DND_LAYOUT_ROOT_ID = 'MAIN_DND_LAYOUT_ID';

export const dndIdName = 'data-dnd-id';
export const dndDataName = 'data-dnd-data';

let mouseDownTime = 0;

export type IDndInfo<T> = {
  dndId: number | string;
  dndData: T;
  info?: any;
  element: HTMLElement;
  mousePosition: { x: number; y: number };
} | null;

export interface IDndLayoutProps<T> {
  children: ReactNode;
  onDragEnd?: (from: IDndInfo<T>, to: IDndInfo<T>) => void;
  onDragging?: (e: any, data: T | undefined, element?: HTMLElement) => void;
  onHover?: (
    isDragging: boolean,
    hoverData: T,
    hoverElement: HTMLElement,
    currentDragInfo: IDndInfo<T>,
    e: any
  ) => void;
  onComponentClicked?: (dndData: T, dndId: number | string) => void;
  onMouseRightClick?: (dndInfo: IDndInfo<T>, e: any) => void;
  onMouseLeave?: () => void;
  style?: CSSProperties;
}

export const getContainerElement = (fiberNode: any): any => {
  if (!fiberNode) return null;
  if (fiberNode?.stateNode?.nodeType === 1) {
    return fiberNode.stateNode;
  }
  return getContainerElement(fiberNode.child);
};

const getFiberNodeFromEvent = (e: any) => {
  if (e._targetInst) return e._targetInst;
  const fiberKey = Object.keys(e.target).find((key) =>
    /^__reactFiber/.test(key)
  ) as string;
  return e.target[fiberKey];
};

const getRealNode = (node: any): any => {
  if (!node || node.memoizedProps.id === DND_LAYOUT_ROOT_ID) return null;
  const hasId = Object.hasOwn(node.memoizedProps, dndIdName);
  return hasId ? node : getRealNode(node?.return);
};

const getMousePositionFromEvent = (e: MouseEvent) => {
  return {
    x: e.offsetX || 0,
    y: e.offsetY || 0,
  };
};

export const getInfoFromFiberNode = (e: any) => {
  const fiberNode = getFiberNodeFromEvent(e);
  const info = getRealNode(fiberNode) || { memoizedProps: {} };
  return {
    dndId: info.memoizedProps[dndIdName],
    dndData: info.memoizedProps[dndDataName],
    info,
    element: getContainerElement(info),
    mousePosition: getMousePositionFromEvent(e.nativeEvent),
  };
};

export default function DndLayout<T extends { [key: string]: any }>({
  children,
  onDragEnd,
  onComponentClicked,
  onMouseRightClick,
  onHover,
  onMouseLeave,
  onDragging,
  style,
}: IDndLayoutProps<T>) {
  const { currentDragRef, isDragging, setIsDragging, onMouseMoving } =
    useDndContext();
  const elementPreOpacityRef = useRef<number>(1);
  const [mouseDown, setMouseDown] = useState(false);

  useEffect(() => {
    const { element } = currentDragRef.current || {};
    if (element) {
      const { opacity } = getComputedStyle(element);
      if (isDragging) {
        elementPreOpacityRef.current = Number(opacity);
        element.style.setProperty(
          'opacity',
          `${Number(opacity) * 0.5}`,
          'important'
        );
      } else {
        element.style.setProperty('opacity', `${elementPreOpacityRef.current}`);
      }
    }
  }, [isDragging]);

  const onEnd = useCallback(
    (e: any) => {
      const from = currentDragRef.current;
      const to = getInfoFromFiberNode(e);
      if (!to.dndId) return null;
      onDragEnd && onDragEnd(from, to);
    },
    [onDragEnd]
  );

  const onClick = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      setIsDragging(false);
      const { dndData, dndId } = getInfoFromFiberNode(e);
      if (!dndData || !dndId) return;
      onComponentClicked && onComponentClicked(dndData, dndId);
    },
    [onComponentClicked]
  );

  const onUp = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      setMouseDown(false);
      if (e.nativeEvent.button !== 0) return;
      const upTime = new Date().getTime();
      upTime - mouseDownTime < 200 ? onClick(e) : onEnd(e);
      setIsDragging(false);
    },
    [onClick, onEnd]
  );

  const onDown = useCallback((e: SyntheticEvent<any, MouseEvent>) => {
    if (e.nativeEvent.button !== 0) return;
    setMouseDown(true);
    mouseDownTime = new Date().getTime();
    const dragInfo = getInfoFromFiberNode(e);
    const dragElement = getContainerElement(dragInfo.info);
    currentDragRef.current = {
      ...dragInfo,
      element: dragElement,
    };
  }, []);

  const onOver = useCallback(
    (e: SyntheticEvent) => {
      const { dndData, info } = getInfoFromFiberNode(e);
      if (!dndData || !info || !onHover) return;
      const element = getContainerElement(info);
      element &&
        onHover(isDragging, dndData, element, currentDragRef.current, e);
    },
    [onHover, isDragging]
  );

  const onMove = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      onMouseMoving(e);
      const { dndData, element, dndId } = currentDragRef.current || {};
      if (mouseDown && dndId !== undefined) {
        setIsDragging(true);
        onDragging && onDragging(e, dndData, element);
      }
    },
    [mouseDown, onDragging]
  );

  const onContextMenu = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      const dndInfo = getInfoFromFiberNode(e);
      onMouseRightClick && onMouseRightClick(dndInfo, e);
    },
    [onMouseRightClick]
  );

  const onLeave = useCallback(() => {
    setMouseDown(false);
    setIsDragging(false);
    onMouseLeave && onMouseLeave();
  }, [onMouseLeave]);

  const memoStyle = useMemo(() => {
    return isDragging ? { ...style, cursor: 'move' } : style;
  }, [style, isDragging]);

  return (
    <div
      id={DND_LAYOUT_ROOT_ID}
      style={memoStyle}
      className="dnd-layout-container"
      onMouseDown={onDown}
      onMouseOver={onOver}
      onMouseMove={onMove}
      onMouseUp={onUp}
      onContextMenu={onContextMenu}
      onMouseLeave={onLeave}
    >
      {children}
    </div>
  );
}
