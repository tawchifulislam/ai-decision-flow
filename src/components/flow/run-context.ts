import { createContext } from 'react';
import type { NodeVisual } from '@/lib/types';

export const RunVisualContext = createContext<Record<string, NodeVisual>>({});
