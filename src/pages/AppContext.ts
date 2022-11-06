import { createContext } from 'react';
import { Resources } from '@gitbeaker/core';

export interface IAppContext {
  client: Resources.Gitlab;
}

export const AppContext = createContext<IAppContext>({} as any);
