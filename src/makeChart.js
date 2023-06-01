import Chart from "chart.js/auto";

export function makeChart(data, target) {
  return new Chart(document.getElementById(target), {
    type: "scatter",
    options: {
      animation: true,
      plugins: {
        legend: {
          display: true,
        },
        tooltip: {
          enabled: true,
        },
      },
      aspectRatio: 1,
      scales: {
        x: {
          title: {
            display: true,
            text: "Wavelenght (nm)",
          },
          // max: 500,
          ticks: {
            callback: (value) => `${value} nm`,
          },
        },
        y: {
          title: {
            display: true,
            text: "Intensity",
          },
          // max: 500,
          ticks: {
            callback: (value) => `${value / 1000}k m`,
          },
        },
      },
    },
    data: {
      labels: data.map((row) => row.nm),
      datasets: [
        {
          label: "Color Graph",
          data: data.map((row) => row.intensity),
        },
      ],
    },
  });
}
