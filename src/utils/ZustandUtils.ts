import { create, StateCreator, StoreApi, UseBoundStore } from 'zustand';
import { devtools } from 'zustand/middleware';

//https://www.youtube.com/watch?v=o4UTnrXmgac&t=10s&ab_channel=HolyJS
export const createStore = <T>(fn: StateCreator<T>, name: string): UseBoundStore<StoreApi<T>> => {
  if (process.env.NODE_ENV !== 'production') {
    return create<T>()(devtools(fn, { name }));
  }

  return create<T>()(fn);
};
