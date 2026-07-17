import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function StudentVsClassAverageChart({ studentData, classData }) {
  const { darkMode } = useTheme();
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.15)';

  // Find all unique subjects from both student and class data
  const subjectsSet = new Set([
    ...studentData.map((d) => d.subject),
    ...classData.map((d) => d.subject),
  ]);
  const subjects = Array.from(subjectsSet).sort();

  // Create lookup maps for quick access
  const studentMap = new Map(studentData.map((d) => [d.subject, d.value]));
  const classMap = new Map(classData.map((d) => [d.subject, d.value]));

  const chartData = {
    labels: subjects,
    datasets: [
      {
        label: 'Student Score',
        data: subjects.map((sub) => studentMap.get(sub) || 0),
        backgroundColor: '#3b82f6', // blue
        borderRadius: 4,
        maxBarThickness: 32,
      },
      {
        label: 'Class Average',
        data: subjects.map((sub) => classMap.get(sub) || 0),
        backgroundColor: 'rgba(148, 163, 184, 0.4)', // slate/grey
        borderRadius: 4,
        maxBarThickness: 32,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          boxWidth: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            return `${ctx.dataset.label}: ${ctx.parsed.y}%`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: textColor,
          callback: (v) => `${v}%`,
        },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div className="h-[240px] w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
