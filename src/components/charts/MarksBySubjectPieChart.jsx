import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

// Distinct palette for clear color differences (indigo, teal, orange)
const COLORS = [
  '#6366f1', // indigo
  '#06b6d4', // teal
  '#f97316', // orange
  '#ef4444', // red
  '#a78bfa', // light indigo
  '#60a5fa', // light blue
];

export default function MarksBySubjectPieChart({ data }) {
  const { darkMode } = useTheme();

  if (!data?.length) {
    return (
      <p className="flex h-full items-center justify-center text-sm text-slate-500">
        No marks for this student.
      </p>
    );
  }

  const chartData = {
    labels: data.map((d) => d.subject),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: COLORS.slice(0, data.length),
        borderWidth: 2,
        borderColor: darkMode ? '#0f172a' : '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 8 },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: darkMode ? '#94a3b8' : '#64748b',
          boxWidth: 10,
          padding: 12,
          font: { size: 11 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = data[ctx.dataIndex];
            return `${item.subject}: ${item.value}%${item.examCount > 1 ? ` (avg of ${item.examCount})` : ''}`;
          },
        },
      },
    },
  };

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
      <div className="relative h-[200px] w-full max-h-full">
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
