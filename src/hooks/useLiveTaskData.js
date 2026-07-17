import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchTaskData, isTaskSheetConfigured } from '../services/taskManagementService';
import { googleSheetsConfig } from '../services/googleSheetsClient';

/**
 * Hook for live task management data
 * @param {boolean} enabled - Whether to enable live refresh (default: true)
 */
export const useLiveTaskData = (enabled = true) => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  const fetchAndProcessTasks = useCallback(async () => {
    if (!enabled || !isTaskSheetConfigured()) {
      return;
    }

    try {
      const data = await fetchTaskData();

      if (mountedRef.current) {
        setTasks(data.processed);
        setStats(data.stats);
        setLastUpdated(new Date());
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to fetch task data');
        setLoading(false);
      }
      console.error('Live task data error:', err);
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchAndProcessTasks();

    // Set up interval for live refresh
    const refreshInterval = parseInt(googleSheetsConfig.refreshInterval) || 5000;
    intervalRef.current = setInterval(() => {
      fetchAndProcessTasks();
    }, refreshInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAndProcessTasks]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAndProcessTasks();
  }, [fetchAndProcessTasks]);

  // Stop/start live updates
  const setEnabled = useCallback(
    (enable) => {
      if (enable && !enabled) {
        // Start live refresh
        fetchAndProcessTasks();
        const refreshInterval = parseInt(googleSheetsConfig.refreshInterval) || 5000;
        intervalRef.current = setInterval(() => {
          fetchAndProcessTasks();
        }, refreshInterval);
      } else if (!enable && enabled) {
        // Stop live refresh
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    },
    [enabled, fetchAndProcessTasks]
  );

  return {
    tasks,
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    setEnabled,
    isConfigured: isTaskSheetConfigured(),
  };
};
