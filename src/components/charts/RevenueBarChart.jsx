import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RevenueBarChart({ data }) {
  const { darkMode } = useTheme();
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.15)';

  const chartData = {
    labels: data.map((d) => d.month),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: data.map((d) => d.amount),
        backgroundColor: [
          'rgba(37, 99, 235, 0.85)',
          'rgba(59, 130, 246, 0.85)',
          'rgba(99, 102, 241, 0.85)',
          'rgba(124, 58, 237, 0.85)',
          'rgba(139, 92, 246, 0.85)',
          'rgba(167, 139, 250, 0.85)',
        ],
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        ticks: { color: textColor },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: textColor,
          callback: (v) => `₹${(v / 1000).toFixed(0)}k`,
        },
        grid: { color: gridColor },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
