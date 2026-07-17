import { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { useDashboardData } from './hooks/useDashboardData';
import { exportReportCsv, exportMarksToExcel } from './services/dashboardService';
import { clearSheetCache } from './services/googleSheetsClient';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import PageRouter from './pages/PageRouter';
import { isGoogleSheetsConfigured } from './config/env';
import { pageTitles } from './config/navigation';
import { addStudent, updateStudent, deleteStudents } from './services/studentService';
import StudentModals from './components/students/StudentModals';
import Toast from './components/ui/Toast';
import { addTimetableEntry, updateTimetableEntry, deleteTimetableEntries } from './services/timetableService';
import TimetableModals from './components/timetable/TimetableModals';
import { addExamEntry, updateExamEntry, deleteExamEntries } from './services/examService';
import ExamModals from './components/exam/ExamModals';
import { addMarksEntries, updateMarksEntry, deleteMarksEntries } from './services/marksService';
import MarksModal from './components/marks/MarksModal';

function AppContent() {
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data, loading, refreshing } = useDashboardData(
    activePage === 'dashboard' || activePage === 'studentDashboard' || activePage === 'marks'
  );

  // CRUD States
  const [selectedRows, setSelectedRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [ttModalOpen, setTtModalOpen] = useState(false);
  const [ttModalMode, setTtModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examModalMode, setExamModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [marksModalOpen, setMarksModalOpen] = useState(false);
  const [marksModalMode, setMarksModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [crudLoading, setCrudLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const pageMeta = pageTitles[activePage] || pageTitles.dashboard;

  const handleExport = () => {
    if (!data) return;
    if (activePage === 'marks') {
      exportMarksToExcel(data);
    } else {
      exportReportCsv(data);
    }
  };

  const handleNavigate = (page) => {
    setActivePage(page);
    setSelectedRows([]);
  };

  const handleSaveStudent = async (formData) => {
    setCrudLoading(true);
    try {
      if (modalMode === 'add') {
        await addStudent(formData);
        setToast({ message: 'Student Added Successfully', type: 'success' });
      } else if (modalMode === 'edit') {
        const getRowStudentId = (row) => {
          const keys = Object.keys(row);
          const studentIdKey = keys.find((k) => {
            const lower = k.toLowerCase().trim();
            return lower === 'student_id' || lower === 'student id' || lower === 'studentid';
          });
          return studentIdKey ? String(row[studentIdKey]).trim() : String(row.id);
        };
        const studentId = getRowStudentId(selectedRows[0]);
        await updateStudent(studentId, formData);
        setToast({ message: 'Student Updated Successfully', type: 'success' });
      } else if (modalMode === 'delete') {
        const getRowStudentId = (row) => {
          const keys = Object.keys(row);
          const studentIdKey = keys.find((k) => {
            const lower = k.toLowerCase().trim();
            return lower === 'student_id' || lower === 'student id' || lower === 'studentid';
          });
          return studentIdKey ? String(row[studentIdKey]).trim() : String(row.id);
        };
        const studentIds = selectedRows.map(getRowStudentId);
        await deleteStudents(studentIds);
        setToast({ message: 'Student Deleted Successfully', type: 'success' });
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleSaveTimetable = async (formData) => {
    setCrudLoading(true);
    try {
      if (ttModalMode === 'add') {
        await addTimetableEntry(formData);
        setToast({ message: 'Timetable Entry Added Successfully', type: 'success' });
      } else if (ttModalMode === 'edit') {
        const rowId = selectedRows[0]?.id; // Row sequential index (1-based from conversion)
        await updateTimetableEntry(rowId, formData);
        setToast({ message: 'Timetable Entry Updated Successfully', type: 'success' });
      } else if (ttModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteTimetableEntries(rowIds);
        setToast({ message: 'Timetable Entry Deleted Successfully', type: 'success' });
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setTtModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleSaveExam = async (formData) => {
    setCrudLoading(true);
    try {
      if (examModalMode === 'add') {
        await addExamEntry(formData);
        setToast({ message: 'Exam Entry Added Successfully', type: 'success' });
      } else if (examModalMode === 'edit') {
        const rowId = selectedRows[0]?.id; // Row sequential index (1-based from conversion)
        await updateExamEntry(rowId, formData);
        setToast({ message: 'Exam Entry Updated Successfully', type: 'success' });
      } else if (examModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteExamEntries(rowIds);
        setToast({ message: 'Exam Entry Deleted Successfully', type: 'success' });
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setExamModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleSaveMarks = async (formData) => {
    setCrudLoading(true);
    try {
      if (marksModalMode === 'add') {
        await addMarksEntries(formData);
        setToast({ message: 'Marks Added Successfully', type: 'success' });
      } else if (marksModalMode === 'edit') {
        const rowId = selectedRows[0]?.id;
        await updateMarksEntry(rowId, formData);
        setToast({ message: 'Marks Updated Successfully', type: 'success' });
      } else if (marksModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteMarksEntries(rowIds);
        setToast({ message: 'Marks Deleted Successfully', type: 'success' });
      }
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setMarksModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const getRowStudentId = (row) => {
    if (!row) return '';
    const keys = Object.keys(row);
    const studentIdKey = keys.find((k) => {
      const lower = k.toLowerCase().trim();
      return lower === 'student_id' || lower === 'student id' || lower === 'studentid';
    });
    return studentIdKey ? String(row[studentIdKey]).trim() : String(row.id);
  };

  const selectedRowKeys = selectedRows.filter(Boolean).map(row => {
    if (activePage === 'students') return getRowStudentId(row);
    return String(row.id ?? '');
  });
  
  const existingStudentIds = data?.allStudents?.map(s => s.studentId) || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        activeItem={activePage}
        onNavigate={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <Header
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onMenuClick={() => setSidebarOpen(true)}
          onExport={handleExport}
          refreshing={refreshing}
          lastUpdated={data?.lastUpdated}
          dataSource={isGoogleSheetsConfigured() && data?.source === 'google-sheets' ? 'google-sheets' : 'mock'}
          dashboardData={data}
          loading={loading}
          activePage={activePage}
          selectedRowKeys={selectedRowKeys}
          onAddClick={() => {
            if (activePage === 'students') {
              setModalMode('add');
              setModalOpen(true);
            } else if (activePage === 'exam') {
              setExamModalMode('add');
              setExamModalOpen(true);
            } else if (activePage === 'marks') {
              setMarksModalMode('add');
              setMarksModalOpen(true);
            } else {
              setTtModalMode('add');
              setTtModalOpen(true);
            }
          }}
          onEditClick={() => {
            if (activePage === 'students') {
              setModalMode('edit');
              setModalOpen(true);
            } else if (activePage === 'exam') {
              setExamModalMode('edit');
              setExamModalOpen(true);
            } else if (activePage === 'marks') {
              setMarksModalMode('edit');
              setMarksModalOpen(true);
            } else {
              setTtModalMode('edit');
              setTtModalOpen(true);
            }
          }}
          onDeleteClick={() => {
            if (activePage === 'students') {
              setModalMode('delete');
              setModalOpen(true);
            } else if (activePage === 'exam') {
              setExamModalMode('delete');
              setExamModalOpen(true);
            } else if (activePage === 'marks') {
              setMarksModalMode('delete');
              setMarksModalOpen(true);
            } else {
              setTtModalMode('delete');
              setTtModalOpen(true);
            }
          }}
          crudLoading={crudLoading}
        />

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-blue border-t-transparent" />
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading dashboard…</p>
              </div>
            </div>
          ) : (
            <PageRouter
              activePage={activePage}
              dashboardData={data}
              selectedRows={selectedRows}
              setSelectedRows={setSelectedRows}
              refreshTrigger={refreshTrigger}
            />
          )}
        </main>
      </div>

      <StudentModals
        isOpen={modalOpen}
        mode={modalMode}
        studentData={selectedRows[0]}
        existingStudentIds={existingStudentIds}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveStudent}
        loading={crudLoading}
      />

      <TimetableModals
        isOpen={ttModalOpen}
        mode={ttModalMode}
        timetableData={selectedRows[0]}
        onClose={() => setTtModalOpen(false)}
        onSave={handleSaveTimetable}
        loading={crudLoading}
      />

      <ExamModals
        isOpen={examModalOpen}
        mode={examModalMode}
        examData={selectedRows[0]}
        onClose={() => setExamModalOpen(false)}
        onSave={handleSaveExam}
        loading={crudLoading}
      />

      <MarksModal
        isOpen={marksModalOpen}
        mode={marksModalMode}
        selectedRows={selectedRows}
        onClose={() => setMarksModalOpen(false)}
        onSave={handleSaveMarks}
        loading={crudLoading}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
