export interface BicolorItem {
  id: number;
  name: string;
  cost: number;
}

export interface MarketHistoryEntry {
  hq: boolean;
  pricePerUnit: number;
  quantity: number;
  timestamp: number;
  buyerName: string;
  onMannequin: boolean;
}

export interface MarketHistoryData {
  itemID: number;
  lastUploadTime: number;
  entries: MarketHistoryEntry[];
  regularSaleVelocity: number;
  nqSaleVelocity: number;
  hqSaleVelocity: number;
  worldName: string;
}

export interface MarketHistoryResponse {
  items: { [key: string]: MarketHistoryData };
  worldName: string;
}

export interface CurrentListingsResponse {
  results: {
    itemId: number;
    nq: {
      minListing: {
        world: { price: number };
      };
      dailySaleVelocity: {
        world: { quantity: number };
      };
    };
  }[];
}

export interface PriceCalculation {
  itemId: number;
  name: string;
  cost: number;
  marketPrice: number;
  gilPerGem: number;
  saleVelocity: number;
  score: number;
  currentListings?: number;
}