"use client";

import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function ExpensePieChart({ data }: { data: { category: string, amount: number }[] }) {
  if (!data || data.length === 0) {
    return <div style={{ color: "gray", padding: "1rem 0" }}>近期無支出紀錄可用於分析。</div>;
  }

  const chartData = {
    labels: data.map(d => d.category),
    datasets: [
      {
        data: data.map(d => d.amount),
        backgroundColor: [
          "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF",
          "#FF9F40", "#E7E9ED", "#8AC249", "#CDDC39", "#00BCD4"
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: { color: "var(--foreground)" }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const raw = context.raw;
            return ` $${raw.toLocaleString()}`;
          }
        }
      }
    },
  };

  return (
    <div style={{ padding: "1rem", background: "var(--background)", border: "1px solid #ccc", borderRadius: "8px", width: "100%" }}>
      <h3 style={{ marginTop: 0 }}>本月支出佔比 (Pie Chart)</h3>
      <div style={{ maxWidth: "400px", margin: "0 auto" }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
}
