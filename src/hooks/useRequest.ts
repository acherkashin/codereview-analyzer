import { useState, useCallback } from 'react';

interface RequestCallback<TResult, Params extends any[]> {
  (...parameters: Params): Promise<TResult>;
}

interface UseRequestResult<TResult, Params extends any[]> {
  makeRequest: RequestCallback<TResult | undefined, Params>;
  isLoading: boolean;
  response: TResult | undefined;
  error: any | null;
}

export function useRequest<TResult, Params extends any[]>(
  request: RequestCallback<TResult, Params>
): UseRequestResult<TResult, Params> {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<TResult | undefined>(undefined);
  const [error, setError] = useState<any | null>(null);

  const makeRequest: RequestCallback<TResult | undefined, Params> = useCallback(
    async (...parameters) => {
      setIsLoading(true);
      try {
        const data = await request(...parameters);
        setIsLoading(false);
        setResponse(data);

        return data;
      } catch (error) {
        setIsLoading(false);
        setError(error);
      }
    },
    [request]
  );

  return { makeRequest, isLoading, response, error };
}
