import React from 'react';
import { Tab } from '../types';

export interface DragContextData {
  type: 'tab' | 'plugin';
  tab?: Tab;
  sourceLeafId?: string;
  pluginView?: { viewType: string; displayText: string; };
}

export const DragCtx = React.createContext<{
  dragCtx: DragContextData | null;
  setDragCtx: (ctx: DragContextData | null) => void;
}>({ dragCtx: null, setDragCtx: () => {} });
