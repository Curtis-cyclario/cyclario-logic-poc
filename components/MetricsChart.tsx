
import React, { useEffect, useRef } from 'react';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip } from 'chart.js';
import { MetricSet } from '../types';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Filler, Tooltip);

interface MetricsChartProps {
  history: MetricSet[];
  metricKey: keyof MetricSet;
  label: string;
  color: string;
  unit?: string;
}

const MetricsChart: React.FC<MetricsChartProps> = ({ history, metricKey, label, color, unit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.map((_, i) => i),
        datasets: [{
          label: label,
          data: history.map(h => h[metricKey] as number),
          borderColor: color,
          backgroundColor: `${color}33`,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0 // Disable animation for performance during real-time updates
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(10, 14, 20, 0.9)',
            titleFont: { family: 'Orbitron', size: 10 },
            bodyFont: { family: 'Roboto Mono', size: 10 },
            callbacks: {
              label: (context) => `${label}: ${context.parsed.y.toFixed(4)} ${unit || ''}`
            }
          }
        },
        scales: {
          x: {
            display: false
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.3)',
              font: {
                size: 8,
                family: 'Roboto Mono'
              },
              maxTicksLimit: 3
            }
          }
        }
      }
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.data.labels = history.map((_, i) => i);
      chartRef.current.data.datasets[0].data = history.map(h => h[metricKey] as number);
      chartRef.current.update('none'); // Update without animation for performance
    }
  }, [history, metricKey]);

  return (
    <div className="w-full h-24 relative">
      <div className="absolute top-0 left-0 text-[8px] font-bold font-orbitron text-gray-500 uppercase z-10">
        {label} {unit ? `(${unit})` : ''}
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default MetricsChart;
