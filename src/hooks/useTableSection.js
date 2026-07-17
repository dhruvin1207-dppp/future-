import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchSectionData } from '../services/sectionService';
import { googleSheetsConfig } from '../services/googleSheetsClient';

export const useTableSection = (section, refreshTrigger = 0) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(
    async (isInitial = false) => {
      if (!section) return;
      if (isInitial) setLoading(true);
      else setRefreshing(true);

      try {
        const result = await fetchSectionData(section);
        if (mountedRef.current) setData(result);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [section]
  );

  useEffect(() => {
    mountedRef.current = true;
    load(true);
    const refreshInterval = googleSheetsConfig.refreshInterval || 30000;
    const interval = setInterval(() => load(false), refreshInterval);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [load, refreshTrigger]);

  return { data, loading, refreshing };
};
