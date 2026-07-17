import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip } from 'chart.js';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(ArcElement, Tooltip);

export default function AttendanceDonutChart({ percentage, centerLabel = 'Attendance' }) {
  const { darkMode } = useTheme();
  const safe = Math.min(100, Math.max(0, percentage || 0));
  const remaining = 100 - safe;

  const chartData = {
    labels: ['Present', 'Absent'],
    datasets: [
      {
        data: [safe, remaining],
        backgroundColor: ['#2563eb', darkMode ? '#334155' : '#e2e8f0'],
        borderWidth: 0,
        cutout: '70%',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1,
    layout: { padding: 4 },
    plugins: { legend: { display: false }, tooltip: { enabled: true } },
  };

  return (
    <div className="flex h-full min-h-0 items-center justify-center overflow-hidden p-2">
      <div className="relative aspect-square h-full max-h-[200px] w-full max-w-[200px]">
        <Doughnut data={chartData} options={options} />
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
            {safe}%
          </span>
          <span className="mt-0.5 max-w-[80px] truncate text-center text-xs text-slate-500 dark:text-slate-400">
            {centerLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
