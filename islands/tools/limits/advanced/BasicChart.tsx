// islands/tools/limits/advanced/BasicChart.tsx
import { useEffect, useRef } from "preact/hooks";
import { Chart as ChartJS } from "npm:chart.js@^4.5.0/auto";
import type { Chart as ChartJsType, Scale, Tick } from "chart.js";

import { DistributionType } from "./ChartTypes.ts";
import {
  calculateBetChartData,
  CalculatedPoint,
} from "./utils/calculate-bet-data.ts";

interface BasicChartProps {
  betAmount: number;
  percentageInterval: number;
  distributionType: DistributionType;
  currentProbability: number;
  minDistributionPercentage: number;
  maxDistributionPercentage: number;
  centerShift: number;
  onDistributionChange: (points: CalculatedPoint[]) => void;
}

export default function BasicChart(
  {
    betAmount,
    percentageInterval,
    distributionType,
    currentProbability,
    minDistributionPercentage,
    maxDistributionPercentage,
    centerShift,
    onDistributionChange,
  }: BasicChartProps,
) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<ChartJsType<"line" | "bar"> | null>(null);

  // Custom Chart.js plugin for background colors and vertical lines
  const backgroundPlugin = {
    id: "customBackground",
    beforeDraw(chart: ChartJsType<"line" | "bar">) {
      const { ctx, chartArea, scales } = chart;
      const x = scales.x;
      const y = scales.y;

      if (!x || !y) return;

      const markerProb = currentProbability;
      const markerX = x.getPixelForValue(markerProb);

      // Calculate curve shift center position (50 + centerShift, clamped to 0-100)
      const curveShiftCenter = Math.max(0, Math.min(100, 50 + centerShift));
      const curveShiftX = x.getPixelForValue(curveShiftCenter);

      ctx.save();

      // Green background for "YES" side (left of marker)
      ctx.fillStyle = "rgba(0, 128, 0, 0.1)"; // Semi-transparent green
      ctx.fillRect(
        chartArea.left,
        chartArea.top,
        markerX - chartArea.left,
        chartArea.bottom - chartArea.top,
      );

      // Red background for "NO" side (right of marker)
      ctx.fillStyle = "rgba(255, 0, 0, 0.1)"; // Semi-transparent red
      ctx.fillRect(
        markerX,
        chartArea.top,
        chartArea.right - markerX,
        chartArea.bottom - chartArea.top,
      );

      // Blue vertical line for curve shift center
      if (curveShiftCenter >= 0 && curveShiftCenter <= 100) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.8)"; // Blue color
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Dashed line
        ctx.beginPath();
        ctx.moveTo(curveShiftX, chartArea.top);
        ctx.lineTo(curveShiftX, chartArea.bottom);
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash
      }

      ctx.restore();
    },
  };

  const updateChartDataAndOptions = (
    chart: ChartJsType<"line" | "bar">,
    props: Omit<BasicChartProps, "onDistributionChange">,
  ) => {
    const {
      allXAxisLabels,
      mainDatasetData,
      finalPaddedMaxY,
      barIndex,
      calculatedPoints,
    } = calculateBetChartData({
      betAmount: props.betAmount,
      percentageInterval: props.percentageInterval,
      distributionType: props.distributionType,
      currentProbability: props.currentProbability,
      minDistributionPercentage: props.minDistributionPercentage,
      maxDistributionPercentage: props.maxDistributionPercentage,
      centerShift: props.centerShift,
    });

    onDistributionChange(calculatedPoints);

    if (chart.options.scales?.y) {
      chart.options.scales.y.max = finalPaddedMaxY;
    }

    chart.data.labels = allXAxisLabels;
    chart.data.datasets[0].data = mainDatasetData;
    chart.data.datasets[0].label = "Bet Amount";

    if (chart.data.datasets[1]) {
      const currentProbabilityBarData: (number | null)[] = new Array(
        allXAxisLabels.length,
      ).fill(null);
      if (barIndex !== -1) {
        currentProbabilityBarData[barIndex] = finalPaddedMaxY;
      }
      chart.data.datasets[1].data = currentProbabilityBarData;
      chart.data.datasets[1].label = "Current Probability";
    }

    if (chart.options.plugins?.title) {
      chart.options.plugins.title.text = `Distribution Preview: ${
        props.distributionType.split("-").map((word) =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(" ")
      }`;
    }

    chart.update("none");
  };

  useEffect(() => {
    const canvas = chartRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    chartInstance.current?.destroy();

    chartInstance.current = new ChartJS(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            type: "line",
            label: "Bet Amount",
            data: [],
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.4,
            pointHitRadius: 20,
            pointRadius: 5,
            order: 2,
            spanGaps: true,
          },
          {
            type: "bar",
            label: "Current Probability",
            data: [],
            backgroundColor: "rgba(255, 255, 0, 0.4)",
            borderColor: "rgba(255, 255, 0, 0.6)",
            borderWidth: 1,
            barPercentage: 1.5,
            categoryPercentage: 1.5,
            order: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: {
            labels: { color: "#f0f0f0" },
          },
          title: {
            display: true,
            text: `Distribution Preview: ${
              distributionType.split("-").map((word) =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(" ")
            }`,
            color: "#E5E7EB",
            font: { size: 18 },
          },
          tooltip: {
            callbacks: {
              title: function (context) {
                if (context[0].dataset.type === "bar") {
                  return "Probability";
                }
                return context[0].label;
              },
              label: function (context) {
                if (context.dataset.type === "bar") {
                  return context.label;
                }
                return `${context.dataset.label}: ${
                  Math.round(context.parsed.y)
                }`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "category",
            title: {
              display: true,
              text: "Probability (%)",
              color: "#D1D5DB",
            },
            ticks: {
              color: "#ccc",
              callback: function (
                this: Scale,
                value: string | number,
                _index: number,
                _ticks: Tick[],
              ) {
                const label = this.getLabelForValue(value as number);
                const probValue = parseFloat(label);
                if (
                  probValue === 0 || probValue === 100 || probValue % 25 === 0
                ) {
                  return probValue.toFixed(0) + "%";
                }
                return null;
              },
            },
            grid: { color: "#444" },
          },
          y: {
            beginAtZero: true,
            max: 1000,
            title: {
              display: true,
              text: "Bet Amount",
              color: "#D1D5DB",
            },
            ticks: {
              color: "#ccc",
              callback: function (value) {
                return Math.round(Number(value));
              },
            },
            grid: { color: "#444" },
          },
        },
      },
      // Register the custom plugin
      plugins: [backgroundPlugin],
    });

    const chartRenderedCheck = setTimeout(() => {
      if (chartInstance.current) {
        updateChartDataAndOptions(chartInstance.current, {
          betAmount,
          percentageInterval,
          distributionType,
          currentProbability,
          minDistributionPercentage,
          maxDistributionPercentage,
          centerShift,
        });
      }
    }, 0);

    return () => {
      clearTimeout(chartRenderedCheck);
      chartInstance.current?.destroy();
    };
  }, [currentProbability, centerShift]); // Added centerShift to dependencies

  useEffect(() => {
    if (chartInstance.current) {
      updateChartDataAndOptions(chartInstance.current, {
        betAmount,
        percentageInterval,
        distributionType,
        currentProbability,
        minDistributionPercentage,
        maxDistributionPercentage,
        centerShift,
      });
    }
  }, [
    betAmount,
    percentageInterval,
    distributionType,
    currentProbability,
    minDistributionPercentage,
    maxDistributionPercentage,
    centerShift,
  ]);

  return (
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg relative h-[450px] w-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}
