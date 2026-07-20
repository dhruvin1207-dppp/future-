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
import { addActiveSessionEntry, updateActiveSessionEntry, deleteActiveSessionEntries } from './services/activeSessionService';
import ActiveSessionModals from './components/activeSession/ActiveSessionModals';
import { addFeesEntry, updateFeesEntry, deleteFeesEntries } from './services/feesService';
import FeesModals from './components/fees/FeesModals';
import { addTeacher, updateTeacher, deleteTeachers } from './services/teachersService';
import TeachersModals from './components/teachers/TeachersModals';
import { addInquiry, updateInquiry, deleteInquiries } from './services/inquiryService';
import InquiryModals from './components/inquiry/InquiryModals';

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
  const [activeSessionModalOpen, setActiveSessionModalOpen] = useState(false);
  const [activeSessionModalMode, setActiveSessionModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [feesModalOpen, setFeesModalOpen] = useState(false);
  const [feesModalMode, setFeesModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [teachersModalOpen, setTeachersModalOpen] = useState(false);
  const [teachersModalMode, setTeachersModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryModalMode, setInquiryModalMode] = useState('add'); // 'add' | 'edit' | 'delete'
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
      clearSheetCache(); // bust cache so re-fetch gets fresh data
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
      clearSheetCache(); // bust cache so re-fetch gets fresh data
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
      clearSheetCache(); // bust cache so re-fetch gets fresh data
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
      clearSheetCache(); // bust cache so re-fetch gets fresh data
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

  const handleSaveActiveSession = async (formData) => {
    setCrudLoading(true);
    try {
      if (activeSessionModalMode === 'add') {
        await addActiveSessionEntry(formData);
        setToast({ message: 'Active Session Entry Added Successfully', type: 'success' });
      } else if (activeSessionModalMode === 'edit') {
        const rowId = selectedRows[0]?.id; // Row sequential index (1-based from conversion)
        await updateActiveSessionEntry(rowId, formData);
        setToast({ message: 'Active Session Entry Updated Successfully', type: 'success' });
      } else if (activeSessionModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteActiveSessionEntries(rowIds);
        setToast({ message: 'Active Session Entry Deleted Successfully', type: 'success' });
      }
      clearSheetCache(); // bust cache so re-fetch gets fresh data
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setActiveSessionModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleSaveFees = async (formData) => {
    setCrudLoading(true);
    try {
      if (feesModalMode === 'add') {
        await addFeesEntry(formData);
        setToast({ message: 'Fee Record Added Successfully', type: 'success' });
      } else if (feesModalMode === 'edit') {
        const rowId = selectedRows[0]?.id;
        await updateFeesEntry(rowId, formData);
        setToast({ message: 'Fee Record Updated Successfully', type: 'success' });
      } else if (feesModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteFeesEntries(rowIds);
        setToast({ message: 'Fee Record Deleted Successfully', type: 'success' });
      }
      clearSheetCache(); // bust cache so re-fetch gets fresh data
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setFeesModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleSaveTeacher = async (formData) => {
    setCrudLoading(true);
    try {
      if (teachersModalMode === 'add') {
        await addTeacher(formData);
        setToast({ message: 'Teacher Added Successfully', type: 'success' });
      } else if (teachersModalMode === 'edit') {
        const rowId = selectedRows[0]?.id;
        await updateTeacher(rowId, formData);
        setToast({ message: 'Teacher Updated Successfully', type: 'success' });
      } else if (teachersModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteTeachers(rowIds);
        setToast({ message: 'Teacher Deleted Successfully', type: 'success' });
      }
      clearSheetCache();
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setTeachersModalOpen(false);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || 'Unable to save changes. Please try again.',
        type: 'error',
      });
    } finally {
      setCrudLoading(false);
    }
  };

  const handleSaveInquiry = async (formData) => {
    setCrudLoading(true);
    try {
      if (inquiryModalMode === 'add') {
        await addInquiry(formData);
        setToast({ message: 'Inquiry Added Successfully', type: 'success' });
      } else if (inquiryModalMode === 'edit') {
        const rowId = selectedRows[0]?.id;
        await updateInquiry(rowId, formData);
        setToast({ message: 'Inquiry Updated Successfully', type: 'success' });
      } else if (inquiryModalMode === 'delete') {
        const rowIds = selectedRows.map(r => r.id);
        await deleteInquiries(rowIds);
        setToast({ message: 'Inquiry Deleted Successfully', type: 'success' });
      }
      clearSheetCache();
      setRefreshTrigger(prev => prev + 1);
      setSelectedRows([]);
      setInquiryModalOpen(false);
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

  const handleEditTrigger = () => {
    if (activePage === 'students') {
      setModalMode('edit');
      setModalOpen(true);
    } else if (activePage === 'exam') {
      setExamModalMode('edit');
      setExamModalOpen(true);
    } else if (activePage === 'marks') {
      setMarksModalMode('edit');
      setMarksModalOpen(true);
    } else if (activePage === 'activeSession') {
      setActiveSessionModalMode('edit');
      setActiveSessionModalOpen(true);
    } else if (activePage === 'fees') {
      setFeesModalMode('edit');
      setFeesModalOpen(true);
    } else if (activePage === 'teachers') {
      setTeachersModalMode('edit');
      setTeachersModalOpen(true);
    } else if (activePage === 'newStudentInquiry') {
      setInquiryModalMode('edit');
      setInquiryModalOpen(true);
    } else {
      setTtModalMode('edit');
      setTtModalOpen(true);
    }
  };

  const handleDeleteTrigger = () => {
    if (activePage === 'students') {
      setModalMode('delete');
      setModalOpen(true);
    } else if (activePage === 'exam') {
      setExamModalMode('delete');
      setExamModalOpen(true);
    } else if (activePage === 'marks') {
      setMarksModalMode('delete');
      setMarksModalOpen(true);
    } else if (activePage === 'activeSession') {
      setActiveSessionModalMode('delete');
      setActiveSessionModalOpen(true);
    } else if (activePage === 'fees') {
      setFeesModalMode('delete');
      setFeesModalOpen(true);
    } else if (activePage === 'teachers') {
      setTeachersModalMode('delete');
      setTeachersModalOpen(true);
    } else if (activePage === 'newStudentInquiry') {
      setInquiryModalMode('delete');
      setInquiryModalOpen(true);
    } else {
      setTtModalMode('delete');
      setTtModalOpen(true);
    }
  };

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
            } else if (activePage === 'activeSession') {
              setActiveSessionModalMode('add');
              setActiveSessionModalOpen(true);
            } else if (activePage === 'fees') {
              setFeesModalMode('add');
              setFeesModalOpen(true);
            } else if (activePage === 'teachers') {
              setTeachersModalMode('add');
              setTeachersModalOpen(true);
            } else if (activePage === 'newStudentInquiry') {
              setInquiryModalMode('add');
              setInquiryModalOpen(true);
            } else {
              setTtModalMode('add');
              setTtModalOpen(true);
            }
          }}
          onEditClick={handleEditTrigger}
          onDeleteClick={handleDeleteTrigger}
          crudLoading={crudLoading}
        />

        <main className="px-3 py-4 sm:px-6 lg:px-8">
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

      <ActiveSessionModals
        isOpen={activeSessionModalOpen}
        mode={activeSessionModalMode}
        sessionData={selectedRows[0]}
        onClose={() => setActiveSessionModalOpen(false)}
        onSave={handleSaveActiveSession}
        loading={crudLoading}
      />

      <FeesModals
        isOpen={feesModalOpen}
        mode={feesModalMode}
        feesData={selectedRows[0]}
        onClose={() => setFeesModalOpen(false)}
        onSave={handleSaveFees}
        loading={crudLoading}
      />

      <TeachersModals
        isOpen={teachersModalOpen}
        mode={teachersModalMode}
        teacherData={selectedRows[0]}
        selectedRows={selectedRows}
        existingTeacherIds={data?.teachers?.map(t => String(t.teacher_id || t.teacherId || '').trim()).filter(Boolean) || []}
        onClose={() => setTeachersModalOpen(false)}
        onSave={handleSaveTeacher}
        loading={crudLoading}
      />

      <InquiryModals
        isOpen={inquiryModalOpen}
        mode={inquiryModalMode}
        inquiryData={selectedRows[0]}
        selectedRows={selectedRows}
        onClose={() => setInquiryModalOpen(false)}
        onSave={handleSaveInquiry}
        loading={crudLoading}
      />

      {/* Floating CRUD Selection Action Bar when rows are checked */}
      {selectedRowKeys.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-4 rounded-full border border-slate-200 bg-white/90 px-6 py-3.5 shadow-xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200">
            {selectedRowKeys.length} {selectedRowKeys.length === 1 ? 'row' : 'rows'} selected
          </span>
          <div className="h-4 w-px bg-slate-200 dark:bg-slate-850" />
          <div className="flex gap-2">
            {selectedRowKeys.length === 1 && (
              <button
                type="button"
                onClick={handleEditTrigger}
                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 shadow-sm active:scale-95 transition"
              >
                Edit
              </button>
            )}
            <button
              type="button"
              onClick={handleDeleteTrigger}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-rose-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-rose-500 shadow-sm active:scale-95 transition"
            >
              Delete
            </button>
          </div>
        </div>
      )}

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
