import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDashboardData, fetchLiveAttendanceFromSheets, formatLiveAttendanceForDashboard } from '../services/dashboardService';
import { isGoogleSheetsConfigured, googleSheetsConfig } from '../services/googleSheetsClient';

export const useDashboardData = (enabled = true) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);
  const intervalRef = useRef(null);

  const load = useCallback(async (isInitial = false) => {
    if (!enabled) return;
    if (isInitial) setLoading(true);
    else setRefreshing(true);

    try {
      let result = await fetchDashboardData();
      
      // If Google Sheets is configured, fetch and merge live attendance
      if (isGoogleSheetsConfigured()) {
        try {
          const liveAttendance = await fetchLiveAttendanceFromSheets();
          const formattedAttendance = formatLiveAttendanceForDashboard(liveAttendance.summaryByStudent);
          
          // Override attendance data with live Google Sheets data
          result.charts.attendancePercentage = formattedAttendance.attendancePercentage;
          result.charts.attendanceByStudent = formattedAttendance.attendanceByStudent;
          result.stats.attendancePercentage = formattedAttendance.attendancePercentage;
          result.liveAttendanceSource = 'google-sheets';
          result.lastAttendanceUpdate = liveAttendance.lastFetched;
        } catch (gsError) {
          console.warn('Google Sheets attendance fetch failed:', gsError.message);
          result.liveAttendanceSource = 'mock-fallback';
        }
      }
      
      if (mountedRef.current) setData(result);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [enabled]);

  useEffect(() => {
    mountedRef.current = true;

    if (enabled) {
      // Only show spinner on first load if we don't have data yet
      load(data === null);

      const refreshInterval = googleSheetsConfig.refreshInterval || 30000;
      intervalRef.current = setInterval(() => load(false), refreshInterval);
    }

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [load, enabled]);

  return { data, loading: enabled ? loading && !data : false, refreshing, refresh: () => load(false) };
};
