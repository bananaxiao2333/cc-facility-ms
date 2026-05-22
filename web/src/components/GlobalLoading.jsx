import { useState, useEffect, useRef } from 'react';
import { useApiLoading } from '../context/ApiLoadingContext';

export default function GlobalLoading() {
  const { loading, current } = useApiLoading();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (loading) {
      startRef.current = Date.now();
      setElapsed(0);
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000);
      }, 100);
    } else {
      clearInterval(timerRef.current);
      if (mounted) setVisible(false);
    }
    return () => clearInterval(timerRef.current);
  }, [loading]);

  if (!mounted && !loading) return null;

  return (
    <div
      className={'global-loading-overlay' + (visible ? ' global-loading-overlay--visible' : '')}
      onTransitionEnd={() => {
        if (!visible) setMounted(false);
      }}
    >
      <div className="global-loading-box">
        <div className="global-loading-row">
          <div className="global-loading-spinner">
            <img src="/favicon.png" alt="" />
          </div>
          <span className="global-loading-brand">CC Facility</span>
        </div>
        <span className="global-loading-text">Inprogress</span>
        <span className="global-loading-elapsed">{elapsed.toFixed(1)}s</span>
        {current && <span className="global-loading-endpoint">{current}</span>}
      </div>
    </div>
  );
}
