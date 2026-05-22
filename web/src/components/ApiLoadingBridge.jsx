import { useEffect } from 'react';
import { useApiLoading } from '../context/ApiLoadingContext';
import { setLoadingNotifier } from '../api/client';

export default function ApiLoadingBridge() {
  const { start, finish } = useApiLoading();

  useEffect(() => {
    setLoadingNotifier(start, finish);
  }, [start, finish]);

  return null;
}
