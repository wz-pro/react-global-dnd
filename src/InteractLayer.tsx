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

const INTERACT_LAYER_ID = '__dnd-interact-layer';

const DRAG_LAYER_ID = '__dnd-drag-layer';

interface InteractLayerProps {
  // hoverLayer?: ReactNode;
  dragLayer?: ReactNode;
}

export default function InteractLayer({ dragLayer }: InteractLayerProps) {
  const {
    isDragging,
    currentDragRef,
    registerMovingListener,
    unRegisterMovingListener,
  } = useDndContext();

  const clonedDragEleRef = useRef<HTMLElement | null>(null);
  const [move, setMove] = useState([0, 0]);
  const dragLayerRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      if (!isDragging || !currentDragRef.current) return;
      const { movementX, movementY } = e.nativeEvent;
      const { element } = currentDragRef.current;
      setMove((prevState) => [
        prevState[0] + movementX,
        prevState[1] + movementY,
      ]);
      if (!dragLayer && dragLayerRef.current && !clonedDragEleRef.current) {
        dragLayerRef.current.append(element.cloneNode(true));
        clonedDragEleRef.current = dragLayerRef.current;
      }
    },
    [isDragging, dragLayer]
  );

  useEffect(() => {
    if (!isDragging) {
      clonedDragEleRef.current = null;
      setMove([0, 0]);
    }
  }, [isDragging]);

  useEffect(() => {
    registerMovingListener(onMouseMove);
    return () => unRegisterMovingListener(onMouseMove);
  }, [onMouseMove]);

  const dragLayerContainerStyle = useMemo((): CSSProperties => {
    if (!isDragging || !currentDragRef.current) return {};
    const { element, elementPosition } = currentDragRef.current;
    return {
      position: 'absolute',
      width: element.offsetWidth || 0,
      height: element.offsetHeight || 0,
      left: elementPosition.x || 0,
      top: elementPosition.y || 0,
      transform: `translate(${move[0]}px,${move[1]}px)`,
    };
  }, [isDragging, move]);

  return (
    <div id={INTERACT_LAYER_ID} className="interact-layer-container">
      {isDragging ? (
        <div
          ref={dragLayerRef}
          style={dragLayerContainerStyle}
          id={DRAG_LAYER_ID}
        >
          {dragLayer}
        </div>
      ) : null}
    </div>
  );
}
