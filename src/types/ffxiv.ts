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

export interface Listing {
  lastReviewTime: number;
  pricePerUnit: number;
  quantity: number;
  stainID: number;
  creatorName: string;
  creatorID: null | string;
  hq: boolean;
  isCrafted: boolean;
  listingID: string;
  materia: any[];
  onMannequin: boolean;
  retainerCity: number;
  retainerID: string;
  retainerName: string;
  sellerID: null | string;
  total: number;
  tax: number;
}

export interface ItemListings {
  itemID: number;
  worldID: number;
  lastUploadTime: number;
  listings: Listing[];
}

export interface CurrentListingsResponse {
  itemIDs: number[];
  items: { [key: string]: ItemListings };
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