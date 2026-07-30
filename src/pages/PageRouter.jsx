import DashboardPage from './DashboardPage';
import StudentDashboardPage from './StudentDashboardPage';
import SectionTablePage from './SectionTablePage';
import TaskManagementPage from './TaskManagementPage';
import DayByDayAttendancePage from './DayByDayAttendancePage';
import { pageTitles, tableSections } from '../config/navigation';

const sectionIds = new Set(tableSections.map((s) => s.id));

export default function PageRouter({
  activePage,
  onNavigate,
  dashboardData,
  selectedRows = [],
  setSelectedRows = null,
  refreshTrigger = 0,
}) {
  if (activePage === 'dashboard') {
    return <DashboardPage data={dashboardData} onNavigate={onNavigate} />;
  }

  if (activePage === 'studentDashboard') {
    return <StudentDashboardPage data={dashboardData} />;
  }

  if (activePage === 'tasks') {
    return <TaskManagementPage />;
  }

  if (activePage === 'dayByDayAttendance') {
    return <DayByDayAttendancePage />;
  }

  if (sectionIds.has(activePage)) {
    const title = pageTitles[activePage]?.title || activePage;
    return (
      <SectionTablePage
        section={activePage}
        title={title}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        refreshTrigger={refreshTrigger}
        dashboardData={dashboardData}
      />
    );
  }

  return null;
}
