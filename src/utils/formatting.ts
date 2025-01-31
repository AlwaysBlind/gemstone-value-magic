import { PriceCalculation } from "../types/ffxiv";

export const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

export const formatMarketPrice = (calculation: PriceCalculation): string => {
  if (calculation.marketPrice === -1) return "No data available";
  if (calculation.marketPrice === 0) return "No recent sales";
  return `${formatNumber(Math.round(calculation.marketPrice))} gil`;
};

export const formatGilPerGem = (calculation: PriceCalculation): string => {
  if (calculation.marketPrice <= 0) return "-";
  return `${formatNumber(Math.round(calculation.gilPerGem))} gil`;
};

export const formatScore = (calculation: PriceCalculation): string => {
  if (calculation.marketPrice <= 0) return "-";
  return formatNumber(calculation.score);
};