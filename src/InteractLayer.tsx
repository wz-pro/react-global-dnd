import { SyntheticEvent, useCallback, useEffect, useRef } from 'react';

import { useDndContext } from './Store';

const INTERACT_LAYER_ID = '__dnd-interact-layer';

export default function InteractLayer() {
  const {
    isDragging,
    currentDragRef,
    registerMovingListener,
    unRegisterMovingListener,
  } = useDndContext();

  const clonedDragEleRef = useRef<HTMLElement | null>(null);

  const onMouseMove = useCallback(
    (e: SyntheticEvent<any, MouseEvent>) => {
      if (!isDragging || !currentDragRef.current) return;
      const { clientY, clientX, currentTarget } = e.nativeEvent;
      const { offsetTop = 0, offsetLeft = 0 } = currentTarget || ({} as any);
      const { element, mousePosition } = currentDragRef.current;
      const position = {
        y: clientY - offsetTop - mousePosition.y,
        x: clientX - offsetLeft - mousePosition.x,
      };
      if (!clonedDragEleRef.current) {
        const { height, width } = getComputedStyle(element);
        const tempNode = document.createElement('div');
        tempNode.style.position = 'absolute';
        tempNode.style.left = `${position.x}px`;
        tempNode.style.top = `${position.y}px`;
        tempNode.append(element.cloneNode(true));
        (tempNode.children[0] as HTMLElement).style.width = width;
        (tempNode.children[0] as HTMLElement).style.height = height;
        clonedDragEleRef.current = tempNode;
        document
          .getElementById(INTERACT_LAYER_ID)
          ?.append(clonedDragEleRef.current);
      } else {
        clonedDragEleRef.current.style.left = `${position.x}px`;
        clonedDragEleRef.current.style.top = `${position.y}px`;
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (!isDragging && clonedDragEleRef.current) {
      clonedDragEleRef.current?.remove();
      clonedDragEleRef.current = null;
    }
  }, [isDragging]);

  useEffect(() => {
    registerMovingListener(onMouseMove);
    return () => unRegisterMovingListener(onMouseMove);
  }, [onMouseMove]);

  return <div id={INTERACT_LAYER_ID} className="interact-layer-container" />;
}
