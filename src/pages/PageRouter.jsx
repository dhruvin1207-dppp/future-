import DashboardPage from './DashboardPage';
import StudentDashboardPage from './StudentDashboardPage';
import SectionTablePage from './SectionTablePage';
import TaskManagementPage from './TaskManagementPage';
import { pageTitles, tableSections } from '../config/navigation';

const sectionIds = new Set(tableSections.map((s) => s.id));

export default function PageRouter({
  activePage,
  dashboardData,
  selectedRows = [],
  setSelectedRows = null,
  refreshTrigger = 0,
}) {
  if (activePage === 'dashboard') {
    return <DashboardPage data={dashboardData} />;
  }

  if (activePage === 'studentDashboard') {
    return <StudentDashboardPage data={dashboardData} />;
  }

  if (activePage === 'tasks') {
    return <TaskManagementPage />;
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
