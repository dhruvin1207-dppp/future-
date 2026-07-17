import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchLiveAttendanceData,
  getAttendanceSummaryByStudent,
  getOverallAttendancePercentage,
  isGoogleSheetsConfigured,
  googleSheetsConfig,
} from '../services/googleSheetsClient';

/**
 * Hook for live attendance data with optional sheet selection
 * @param {string} sheetName - Name of the sheet to fetch (optional, defaults to first sheet)
 * @param {boolean} enabled - Whether to enable live refresh (default: true)
 */
export const useLiveAttendance = (sheetName = null, enabled = true) => {
  const [attendanceData, setAttendanceData] = useState(null);
  const [summaryByStudent, setSummaryByStudent] = useState([]);
  const [overallPercentage, setOverallPercentage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [currentSheetName, setCurrentSheetName] = useState(sheetName || googleSheetsConfig.attendanceSheets[0]);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  const fetchAndProcessAttendance = useCallback(async () => {
    if (!enabled || !isGoogleSheetsConfigured()) {
      return;
    }

    try {
      const data = await fetchLiveAttendanceData(currentSheetName);
      
      if (mountedRef.current) {
        setAttendanceData(data);
        setCurrentSheetName(data.sheetName);
        
        const summary = getAttendanceSummaryByStudent(data.processed);
        setSummaryByStudent(summary);
        
        const overallPerc = getOverallAttendancePercentage(summary);
        setOverallPercentage(overallPerc);
        
        setLastUpdated(new Date());
        setError(null);
        setLoading(false);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to fetch attendance data');
        setLoading(false);
      }
      console.error('Live attendance error:', err);
    }
  }, [enabled, currentSheetName]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchAndProcessAttendance();

    // Set up interval for live refresh (5 seconds by default)
    const refreshInterval = parseInt(googleSheetsConfig.refreshInterval) || 5000;
    intervalRef.current = setInterval(() => {
      fetchAndProcessAttendance();
    }, refreshInterval);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAndProcessAttendance]);

  // Manual refresh function
  const refresh = useCallback(() => {
    fetchAndProcessAttendance();
  }, [fetchAndProcessAttendance]);

  // Change active sheet
  const selectSheet = useCallback((newSheetName) => {
    setCurrentSheetName(newSheetName);
    setLoading(true);
  }, []);

  // Stop/start live updates
  const setEnabled = useCallback((enable) => {
    if (enable && !enabled) {
      // Start live refresh
      fetchAndProcessAttendance();
      const refreshInterval = parseInt(googleSheetsConfig.refreshInterval) || 5000;
      intervalRef.current = setInterval(() => {
        fetchAndProcessAttendance();
      }, refreshInterval);
    } else if (!enable && enabled) {
      // Stop live refresh
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [enabled, fetchAndProcessAttendance]);

  return {
    attendanceData,
    summaryByStudent,
    overallPercentage,
    loading,
    error,
    lastUpdated,
    currentSheetName,
    refresh,
    selectSheet,
    setEnabled,
    isConfigured: isGoogleSheetsConfigured(),
  };
};
