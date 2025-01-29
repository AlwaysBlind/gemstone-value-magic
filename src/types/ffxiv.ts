export interface BicolorItem {
  id: number;
  name: string;
  cost: number;
}

export interface MarketData {
  currentAveragePriceNQ: number;
  currentAveragePriceHQ: number;
  regularSaleVelocity: number;
  nqSaleVelocity: number;
  hqSaleVelocity: number;
}

export interface PriceCalculation {
  itemId: number;
  name: string;
  cost: number;
  marketPrice: number;
  gilPerGem: number;
  saleVelocity: number;
}