import {
  CSSProperties,
  ReactNode,
  RefObject,
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
export const dndDataName = 'data-dnd-props';

let mouseDownTime = 0;

export interface IDndProps<T> {
  data: T;
  canDrop: ((dragInfo: IDndInfo<T>) => boolean) | boolean;
  canDrag: boolean;
}
export interface MousePosition {
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
}

export interface ElementPosition {
  clientTop: number;
  clientLeft: number;
  x: number;
  y: number;
}

export type IDndInfo<T> = {
  dndId: number | string;
  dndProps: IDndProps<T>;
  info?: any;
  element: HTMLElement;
  mousePosition: MousePosition;
  elementPosition: ElementPosition;
} | null;

export interface IDndLayoutProps<T> {
  children: ReactNode;
  onDragEnd?: (from: IDndInfo<T>, to: IDndInfo<T>) => void;
  onDragging?: (
    e: SyntheticEvent<any, MouseEvent>,
    data: T | undefined,
    element?: HTMLElement
  ) => void;
  onHover?: (
    isDragging: boolean,
    hoverData: T,
    hoverElement: HTMLElement,
    currentDragInfo: IDndInfo<T>,
    e: SyntheticEvent<any, MouseEvent>
  ) => void;
  onComponentClicked?: (dndData: T, dndId: number | string) => void;
  onMouseRightClick?: (
    dndInfo: IDndInfo<T>,
    e: SyntheticEvent<any, MouseEvent>
  ) => void;
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
  if (!node) return null;
  if (node.memoizedProps.id === DND_LAYOUT_ROOT_ID) {
    return node;
  }
  const hasId = Object.hasOwn(node.memoizedProps, dndIdName);
  return hasId ? node : getRealNode(node?.return);
};

const pxStrToNum = (pStr: string) => {
  const nStr = pStr.replace(/px$/, '');
  return Number(nStr);
};

const getPositionInfo = (
  e: MouseEvent,
  element: HTMLElement,
  rootRef?: RefObject<HTMLDivElement>
) => {
  let {
    clientLeft: rootLeft = 0,
    clientTop: rootTop = 0,
    scrollTop: rootScrollTop = 0,
    scrollLeft: rootScrollLeft = 0,
  } = rootRef?.current || {};
  if (!rootRef) {
    const rootEle = document.getElementById(DND_LAYOUT_ROOT_ID);
    const rec = rootEle?.getBoundingClientRect();
    rootLeft = rec?.left || 0;
    rootTop = rec?.top || 0;
    rootScrollTop = rootEle?.scrollTop || 0;
    rootScrollLeft = rootEle?.scrollLeft || 0;
  }
  const { offsetX = 0, offsetY = 0, clientX, clientY } = e;
  const target: HTMLElement = e.target as HTMLElement;
  const { left = 0, top = 0 } = target?.getBoundingClientRect() || {};
  const targetStyle = getComputedStyle(target);
  const elementStyle = getComputedStyle(element);
  const topOffset =
    pxStrToNum(targetStyle.paddingTop) +
    pxStrToNum(targetStyle.borderTopWidth) -
    pxStrToNum(elementStyle.paddingTop) -
    pxStrToNum(elementStyle.borderTopWidth);
  const leftOffset =
    pxStrToNum(targetStyle.paddingLeft) +
    pxStrToNum(targetStyle.borderLeftWidth) -
    pxStrToNum(elementStyle.paddingLeft) -
    pxStrToNum(elementStyle.borderLeftWidth);
  const { left: comLeft = 0, top: comTop = 0 } =
    element?.getBoundingClientRect() || {};
  return {
    mousePosition: {
      clientX,
      clientY,
      offsetX: offsetX + left - comLeft + topOffset,
      offsetY: offsetY + top - comTop + leftOffset,
      x: clientX - left + rootScrollLeft,
      y: clientY - top + rootScrollTop,
    },
    elementPosition: {
      clientLeft: comLeft,
      clientTop: comTop,
      x: comLeft - rootLeft + rootScrollLeft,
      y: comTop - rootTop + rootScrollTop,
    },
  };
};

export function getInfoFromFiberNode<T>(
  e: SyntheticEvent<any, MouseEvent>
): IDndInfo<T> {
  const fiberNode = getFiberNodeFromEvent(e);
  const info = getRealNode(fiberNode) || { memoizedProps: {} };
  const element = getContainerElement(info);
  const { mousePosition, elementPosition } = getPositionInfo(
    e.nativeEvent,
    element
  );
  return {
    dndId: info.memoizedProps[dndIdName],
    dndProps: info.memoizedProps[dndDataName],
    info,
    element,
    mousePosition,
    elementPosition,
  };
}

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
    useDndContext<T>();
  const elementPreOpacityRef = useRef<number>(1);
  const [mouseDown, setMouseDown] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
    (e: SyntheticEvent<any, MouseEvent>) => {
      const from = currentDragRef.current;
      const to = getInfoFromFiberNode<T>(e);
      if (!to?.dndId) return null;
      onDragEnd && onDragEnd(from, to);
    },
    [onDragEnd]
  );

  const onClick = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      setIsDragging(false);
      const data = getInfoFromFiberNode<T>(e);
      if (!data?.dndProps || !data?.dndId) return;
      onComponentClicked && onComponentClicked(data.dndProps.data, data.dndId);
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
    const dragInfo = getInfoFromFiberNode<T>(e);
    const dragElement = getContainerElement(dragInfo?.info);
    currentDragRef.current = {
      ...dragInfo,
      element: dragElement,
    } as any;
  }, []);

  const onOver = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      const data = getInfoFromFiberNode<T>(e);
      if (!data?.dndProps || !data.info || !onHover) return;
      const element = getContainerElement(data.info);
      element &&
        onHover(
          isDragging,
          data.dndProps?.data,
          element,
          currentDragRef.current,
          e
        );
    },
    [onHover, isDragging]
  );

  const onMove = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      onMouseMoving(e);
      const { dndProps, element, dndId } = currentDragRef.current || {};
      if (mouseDown && dndId !== undefined && dndProps?.canDrag !== false) {
        setIsDragging(true);
        onDragging && onDragging(e, dndProps?.data, element);
      }
    },
    [mouseDown, onDragging]
  );

  const onContextMenu = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();
      const dndInfo = getInfoFromFiberNode<T>(e);
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
      ref={rootRef}
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
