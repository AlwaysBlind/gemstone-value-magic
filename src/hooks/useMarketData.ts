import { useQuery } from "@tanstack/react-query";
import { fetchMarketData, fetchCurrentListings } from "../services/universalis";
import { bicolorItems } from "../data/bicolorItems";
import { PriceCalculation, CurrentListingsResponse } from "../types/ffxiv";

export const useMarketData = (selectedServer: string) => {
  const { data: marketData, isLoading: isLoadingMarket, error: marketError } = useQuery({
    queryKey: ["marketData", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      const data = await fetchMarketData(selectedServer, itemIds);
      return data;
    },
  });

  const { data: currentListings, isLoading: isLoadingListings, error: listingsError } = useQuery({
    queryKey: ["currentListings", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      const data = await fetchCurrentListings(selectedServer, itemIds);
      console.log("Current listings response:", data);
      return data as CurrentListingsResponse;
    },
  });

  const calculatePrices = (): PriceCalculation[] => {
    if (!marketData || !currentListings?.items) {
      return [];
    }

    // First, calculate base metrics for all items
    let items = bicolorItems.map((item) => {
      const itemMarketData = marketData.items[item.id];
      const currentListingData = currentListings.items[item.id];

      if (!itemMarketData || !itemMarketData.entries || itemMarketData.entries.length === 0) {
        return {
          itemId: item.id,
          name: item.name,
          cost: item.cost,
          marketPrice: 0,
          gilPerGem: 0,
          saleVelocity: 0,
          currentListings: 0,
          score: 0,
        };
      }

      let totalPrice = 0;
      let totalQuantity = 0;

      itemMarketData.entries.forEach((sale) => {
        totalPrice += sale.pricePerUnit * sale.quantity;
        totalQuantity += sale.quantity;
      });

      const averagePrice = totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;
      const gilPerGem = Math.round(averagePrice / item.cost);
      const saleVelocity = itemMarketData.regularSaleVelocity || 0;
      const currentListingsCount = currentListingData?.listings?.length || 0;

      return {
        itemId: item.id,
        name: item.name,
        cost: item.cost,
        marketPrice: averagePrice,
        gilPerGem: gilPerGem,
        saleVelocity: saleVelocity,
        currentListings: currentListingsCount,
        score: 0,
      };
    });

    // Filter out items with no market activity
    items = items.filter(item => item.gilPerGem > 0);

    // Implement the ranking algorithm
    let remainingItems = [...items];
    let tier = 1;
    let multiplier = 1000;
    let rankedItems: PriceCalculation[] = [];

    while (remainingItems.length > 0) {
      // Sort items based on velocity/listings ratio and gil per gem
      const sortedItems = remainingItems.sort((a, b) => {
        const aQualifies = (a.saleVelocity * tier) >= (a.currentListings + 1) ? 1 : 0;
        const bQualifies = (b.saleVelocity * tier) >= (b.currentListings + 1) ? 1 : 0;
        
        if (aQualifies !== bQualifies) return bQualifies - aQualifies;
        return b.gilPerGem - a.gilPerGem;
      });

      // Take top 5 items for this tier
      const tierItems = sortedItems.slice(0, 5).map(item => ({
        ...item,
        score: item.gilPerGem * multiplier
      }));

      // Add items to ranked list and remove them from remaining items
      rankedItems.push(...tierItems);
      remainingItems = sortedItems.slice(5);

      // Adjust tier and multiplier for next iteration
      tier *= 2;
      multiplier = Math.max(1, multiplier / 10);
    }

    // Combine ranked items with any remaining unranked items
    return [...rankedItems, ...remainingItems];
  };

  return {
    calculations: calculatePrices(),
    isLoading: isLoadingMarket || isLoadingListings,
    error: marketError || listingsError,
  };
};