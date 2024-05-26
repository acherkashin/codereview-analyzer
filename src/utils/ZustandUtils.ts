import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

//https://www.youtube.com/watch?v=o4UTnrXmgac&t=10s&ab_channel=HolyJS
export const createStore = <T>(fn: Parameters<typeof devtools<T>>[0], name: string) => {
  // ⛔️ If too many pull requests are loaded it will slow down the application, if you enable redux devtools
  return create<T>()(devtools(fn, { name, enabled: process.env.NODE_ENV !== 'production' }));
};
