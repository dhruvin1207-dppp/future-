import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#2563eb',
  '#3b82f6',
  '#6366f1',
  '#7c3aed',
  '#8b5cf6',
  '#a78bfa',
  '#c4b5fd',
];

export default function EnrollmentPieChart({ data }) {
  const { darkMode } = useTheme();

  const chartData = {
    labels: data.map((d) => d.course),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: COLORS.slice(0, data.length),
        borderWidth: 2,
        borderColor: darkMode ? '#0f172a' : '#ffffff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: darkMode ? '#94a3b8' : '#64748b',
          boxWidth: 12,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}
