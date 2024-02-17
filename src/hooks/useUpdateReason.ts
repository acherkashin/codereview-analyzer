import { useRef, useEffect } from 'react';

type Properties = Record<string, any>;

/**
 * This hook makes it easy to see which prop changes are causing a component to re-render.
 * It works only when use dev build
 *
 * USE ONLY FOR DEBUG PURPOSE
 * @param name Name of component which will be printed to console
 * @param props Set of properties which may be changed
 * @example
 * useUpdateReason('DataDesignerEditor', {
 *   editingContextId: context.editingContextId,
 *   mappingContext: context.mappingContext,
 *   path,
 * });
 */
export function useUpdateReason(name: string, props: Properties) {
  const previousProps = useRef<Properties | undefined>(undefined);

  useEffect(() => {
    if (previousProps.current != null) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changesObj: Properties = {};
      allKeys.forEach((key) => {
        if (previousProps?.current?.[key] !== props[key]) {
          changesObj[key] = {
            from: previousProps.current?.[key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changesObj).length) {
        console.log('[update-reason]', name, changesObj);
      }
    }

    previousProps.current = props;
  });
}
