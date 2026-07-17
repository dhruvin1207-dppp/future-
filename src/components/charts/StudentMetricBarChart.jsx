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

export default function StudentMetricBarChart({
  data,
  valueKey = 'value',
  labelKey = 'studentId',
  yMax = 100,
  yLabel = '%',
  color = '#2563eb',
  tooltipLabel,
}) {
  const { darkMode } = useTheme();
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.15)';

  const chartData = {
    labels: data.map((d) => d[labelKey]),
    datasets: [
      {
        label: tooltipLabel || yLabel,
        data: data.map((d) => d[valueKey]),
        backgroundColor: color,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = data[ctx.dataIndex];
            if (item?.present !== undefined) {
              return `${ctx.parsed.y}${yLabel} (${item.present}/${item.total} classes)`;
            }
            if (item?.examCount) {
              return `${ctx.parsed.y}${yLabel} · ${item.examCount} exam(s)`;
            }
            return `${ctx.parsed.y}${yLabel}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
        grid: { display: false },
      },
      y: {
        min: 0,
        max: yMax,
        ticks: {
          color: textColor,
          callback: (v) => `${v}${yLabel}`,
        },
        grid: { color: gridColor },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
