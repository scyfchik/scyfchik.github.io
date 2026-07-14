const chartRegistry = new Map();

function chartOptions() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    responsive: true,
    maintainAspectRatio: true,
    animation: reducedMotion ? false : undefined,
    plugins: { legend: { display: false }, filler: { propagate: true } },
    scales: { x: { display: false }, y: { display: false, beginAtZero: true } },
  };
}

export function createLineChart(key, canvas, history, label = "CCU") {
  if (!canvas || typeof window.Chart !== "function" || !Array.isArray(history) || history.length === 0) return null;
  destroyChart(key);
  const chart = new window.Chart(canvas.getContext("2d"), {
    type: "line",
    data: {
      labels: history.map((_, index) => String(index + 1)),
      datasets: [{
        label,
        data: history,
        borderColor: "#7a9cff",
        backgroundColor: "rgba(122, 156, 255, 0.15)",
        tension: 0.4,
        fill: true,
        pointRadius: 3,
        pointBackgroundColor: "#7a9cff",
        pointBorderColor: "#fff",
        borderWidth: 2,
      }],
    },
    options: chartOptions(),
  });
  chartRegistry.set(key, chart);
  return chart;
}

export function destroyChart(key) {
  const chart = chartRegistry.get(key);
  if (chart) chart.destroy();
  chartRegistry.delete(key);
}

export function destroyChartGroup(prefix) {
  for (const key of [...chartRegistry.keys()]) {
    if (key.startsWith(prefix)) destroyChart(key);
  }
}

export function destroyAllCharts() {
  for (const key of [...chartRegistry.keys()]) destroyChart(key);
}

export function getChartCount(prefix = "") {
  return [...chartRegistry.keys()].filter((key) => key.startsWith(prefix)).length;
}
