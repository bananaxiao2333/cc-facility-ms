import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ApiLoadingContext = createContext(null);

export function ApiLoadingProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const counter = useRef(0);

  const start = useCallback((endpoint) => {
    const id = ++counter.current;
    setRequests((prev) => [...prev, { id, endpoint }]);
    return id;
  }, []);

  const finish = useCallback((id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const loading = requests.length > 0;
  const current = requests[requests.length - 1]?.endpoint ?? null;

  return (
    <ApiLoadingContext.Provider value={{ loading, current, start, finish }}>
      {children}
    </ApiLoadingContext.Provider>
  );
}

export function useApiLoading() {
  const ctx = useContext(ApiLoadingContext);
  if (!ctx) throw new Error('useApiLoading must be inside ApiLoadingProvider');
  return ctx;
}
