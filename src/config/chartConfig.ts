//chartConfig.ts

import type { ChartConfig, TradeHandleRectConfig } from "./chartConfig.types";

const commonHandleProperties: TradeHandleRectConfig = {
  height: 22,
  widthVolume: 60,
  widthPNL: 80,
  widthClose: 24,
  position: {
    placement: "left",
    margin: 100,
  },
  borderWidth: 1,
  borderColor: "#3b82f6",
  borderOpacity: 0.4,
  backgroundColor: "#111827",
  backgroundOpacity: 0.9,
  sectionDividerColor: "rgba(255,255,255,0.12)",
  paddingX: 10,
  closeButtonColor: "#3b82f6",
  showVolumeSection: true,
  showPnlSection: true,
  showCloseSection: true,
};

export const CHART_CONFIG: ChartConfig = {
  zoom: {
    x: {
      speed: 0.05,
      min: 0.03,
      max: 20,
    },
    y: {
      speed: 0.1,
      min: 10,
      max: 500,
    },
  },

  candles: {
    defaultWidth: 8,
    defaultGap: 2,
    minBodyHeight: 1,
    autoFollowLatestCandle: true,
    autoFollowThresholdCandles: 10,
    rightOffsetCandles: 15,

    livePriceLine: {
      visible: true,
      width: 1,
      opacity: 0.7,
      dash: [4, 4],
      bullishColor: "#22c55e",
      bearishColor: "#ef4444",
    },
  },

  crosshair: {
    color: "rgba(255,255,255,0.35)",
    thickness: 1,
    style: "dashed",
  },

  axis: {
    axisXHeight: 30,

    axisX: {
      height: 30,
      backgroundColor: "#11131a",
      borderColor: "rgb(89, 89, 89)",
      borderWidth: 1,
      textColor: "rgba(255, 255, 255, 0.60)",
      font: "12px Arial",
      textAlign: "center",
      tickColor: "rgba(255,255,255,0.12)",
      tickWidth: 1,
      tickLength: 4,
      labelOffsetY: 16,
      minLabelGap: 16,
      crosshairLabel: {
        backgroundColor: "#494949",
        borderColor: "#494949",
        borderWidth: 1,
        textColor: "#ffffff",
        font: "12px Arial",
        paddingX: 8,
        height: 26,
      },
    },

    axisY: {
      width: 80,
      backgroundColor: "#11131a",
      borderColor: "rgb(89, 89, 89)",
      borderWidth: 1,
      textColor: "rgba(255, 255, 255, 0.60)",
      font: "12px Arial",
      textAlign: "left",
      tickCount: 12,
      tickColor: "rgba(255,255,255,0.06)",
      tickWidth: 1,
      tickLength: 8,
      labelOffsetX: 8,
      crosshairLabel: {
        backgroundColor: "#494949",
        borderColor: "#494949",
        borderWidth: 1,
        textColor: "#ffffff",
        font: "12px Arial",
        paddingX: 8,
        height: 20,
      },
    },
  },

  tradeHandles: {
    font: "12px Arial",
    textColor: "#ffffff",
    textOpacity: 0.8,

    slHandle: {
      handle: {
        ...commonHandleProperties,
        borderColor: "#ef4444",
        borderOpacity: 0.4,
        backgroundColor: "#2a1111",
        closeButtonColor: "#ef4444",
        showVolumeSection: false,
      },

      handleLine: {
        width: 1,
        color: "#ef4444",
        opacity: 0.9,
        style: "dashed",
        dash: [4, 4],
      },
    },

    tpHandle: {
      handle: {
        ...commonHandleProperties,
        borderColor: "#22c55e",
        borderOpacity: 0.4,
        backgroundColor: "#0d2418",
        closeButtonColor: "#22c55e",
        showVolumeSection: false,
      },

      handleLine: {
        width: 1,
        color: "#22c55e",
        opacity: 0.9,
        style: "dashed",
        dash: [4, 4],
      },
    },

    startPriceHandle: {
      handle: {
        ...commonHandleProperties,
      },

      handleLine: {
        width: 1,
        color: "#3b82f6",
        opacity: 0.9,
        style: "solid",
      },
    },
  },

  colors: {
    bullish: "#22c55e",
    bearish: "#ef4444",
    background: "#11131a",
  },
};
