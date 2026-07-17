import { fetchGoogleSheetData } from './googleSheetsClient';

export const taskSheetConfig = {
  taskSheetName: import.meta.env.VITE_GOOGLE_SHEETS_TASK_SHEET || 'task management',
};

export const isTaskSheetConfigured = () => Boolean(taskSheetConfig.taskSheetName);

/**
 * Parse task rows from Google Sheets
 * Columns: task, assign task id, due date, priority tag, status
 * @param {Array<Array>} rows - Raw rows from Google Sheets
 * @returns {Array<Object>} Processed task records
 */
export const parseTaskRows = (rows) => {
  if (rows.length < 2) return [];

  const headers = (rows[0] || []).map((h) => String(h || '').toLowerCase().trim());

  // Find column indices
  const taskIdx = headers.findIndex((h) => h.includes('task'));
  const assignIdx = headers.findIndex((h) => h.includes('assign'));
  const dueDateIdx = headers.findIndex((h) => h.includes('due'));
  const priorityIdx = headers.findIndex((h) => h.includes('priority'));
  const statusIdx = headers.findIndex((h) => h.includes('status'));

  const tasks = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] || [];

    // Skip empty rows
    const taskName = taskIdx >= 0 ? row[taskIdx] : '';
    if (!taskName) continue;

    const task = {
      id: `task-${i}`,
      name: taskName || 'Untitled',
      assigneeId: assignIdx >= 0 ? row[assignIdx] : '',
      dueDate: dueDateIdx >= 0 ? row[dueDateIdx] : '',
      priority: priorityIdx >= 0 ? (row[priorityIdx] || 'Normal').toLowerCase() : 'normal',
      status: statusIdx >= 0 ? (row[statusIdx] || 'Pending').toLowerCase() : 'pending',
      rawStatus: statusIdx >= 0 ? row[statusIdx] : 'Pending',
    };

    tasks.push(task);
  }

  return tasks;
};

/**
 * Fetch task data from Google Sheets
 * @returns {Promise<Object>} Processed task data
 */
export const fetchTaskData = async () => {
  try {
    if (!isTaskSheetConfigured()) {
      throw new Error('Task sheet not configured');
    }

    const range = taskSheetConfig.taskSheetName;
    console.log('Fetching task data from sheet:', range);
    console.log('Sheet config:', taskSheetConfig);
    
    const rows = await fetchGoogleSheetData(range);

    if (rows.length < 2) {
      return { raw: rows, processed: [], stats: getTaskStats([]) };
    }

    const tasks = parseTaskRows(rows);
    const stats = getTaskStats(tasks);

    return {
      raw: rows,
      processed: tasks,
      stats,
      lastFetched: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching task data:', error);
    console.error('Task sheet config:', taskSheetConfig);
    throw error;
  }
};

/**
 * Calculate task statistics
 * @param {Array<Object>} tasks - Array of task objects
 * @returns {Object} Task statistics
 */
export const getTaskStats = (tasks) => {
  const stats = {
    total: tasks.length,
    completed: 0,
    pending: 0,
    inProgress: 0,
    overdue: 0,
    highPriority: 0,
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  tasks.forEach((task) => {
    // Count by status
    if (task.status.includes('completed') || task.status.includes('done')) {
      stats.completed += 1;
    } else if (task.status.includes('progress')) {
      stats.inProgress += 1;
    } else {
      stats.pending += 1;
    }

    // Count high priority
    if (task.priority.includes('high') || task.priority.includes('urgent')) {
      stats.highPriority += 1;
    }

    // Check for overdue tasks
    if (task.dueDate && !task.status.includes('completed')) {
      try {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          stats.overdue += 1;
        }
      } catch (e) {
        // Invalid date format, skip
      }
    }
  });

  stats.completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return stats;
};

/**
 * Get priority color
 * @param {string} priority - Priority level
 * @returns {string} Tailwind color class
 */
export const getPriorityColor = (priority) => {
  const p = String(priority).toLowerCase();
  if (p.includes('urgent') || p.includes('critical')) return 'red';
  if (p.includes('high')) return 'orange';
  if (p.includes('medium')) return 'yellow';
  return 'green';
};

/**
 * Get status color
 * @param {string} status - Task status
 * @returns {string} Tailwind color class
 */
export const getStatusColor = (status) => {
  const s = String(status).toLowerCase();
  if (s.includes('completed') || s.includes('done')) return 'green';
  if (s.includes('progress')) return 'blue';
  if (s.includes('pending')) return 'gray';
  return 'gray';
};
