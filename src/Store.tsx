import React, {
  createContext,
  Dispatch,
  MutableRefObject,
  ReactNode,
  SetStateAction,
  SyntheticEvent,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';

import { IDndInfo } from './DndLayout';

interface DndContextValue<D> {
  isDragging: boolean;
  setIsDragging: Dispatch<SetStateAction<boolean>>;
  currentDragRef: MutableRefObject<IDndInfo<D> | null>;
  movingEventRef: MutableRefObject<SyntheticEvent | null>;
  registerMovingListener: (listener: Listener) => void;
  unRegisterMovingListener: (listener: Listener) => void;
  onMouseMoving: (e: SyntheticEvent<any, MouseEvent>) => void;
}

const DndContext = createContext<DndContextValue<any>>({} as any);

interface ProviderProps {
  children: ReactNode;
}

type Listener = (e: SyntheticEvent<any, MouseEvent>) => void;

function Provider<T>({ children }: ProviderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const currentDragRef = useRef<IDndInfo<T>>(null);
  const movingEventRef = useRef<SyntheticEvent | null>(null);
  const movingListenersRef = useRef<Listener[]>([]);

  const registerMovingListener = useCallback((listener: Listener) => {
    movingListenersRef.current.push(listener);
  }, []);

  const unRegisterMovingListener = useCallback((listener: Listener) => {
    movingListenersRef.current = movingListenersRef.current.filter(
      (item) => item !== listener
    );
  }, []);

  const onMouseMoving = useCallback((e: SyntheticEvent<any, MouseEvent>) => {
    movingListenersRef.current.forEach((listener) => listener(e));
  }, []);

  const providerValue: DndContextValue<T> = {
    currentDragRef,
    isDragging,
    setIsDragging,
    movingEventRef,
    registerMovingListener,
    unRegisterMovingListener,
    onMouseMoving,
  };

  return (
    <DndContext.Provider value={providerValue}>{children}</DndContext.Provider>
  );
}

function useDndContext<T>(): DndContextValue<T> {
  return useContext<DndContextValue<T>>(DndContext);
}

export { Provider, useDndContext };
