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
    let calculations = bicolorItems.map((item) => {
      const itemMarketData = marketData.items[item.id];
      const currentListingData = currentListings.items[item.id];

      if (!itemMarketData || !itemMarketData.entries) {
        return {
          itemId: item.id,
          name: item.name,
          cost: item.cost,
          marketPrice: -1,
          gilPerGem: 0,
          saleVelocity: 0,
          currentListings: 0,
          score: 0,
        };
      }

      const recentSales = itemMarketData.entries;
      if (recentSales.length === 0) {
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

      recentSales.forEach((sale) => {
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
        score: 0, // Initial score, will be updated in tiers
      };
    });

    // Filter out items with no market data or zero gil per gem
    calculations = calculations.filter(item => item.gilPerGem > 0);

    // Function to get top N items by gil per gem with velocity condition
    const getTopNItems = (items: PriceCalculation[], velocityMultiplier: number, n: number, excludeIds: Set<number>) => {
      return items
        .filter(item => 
          !excludeIds.has(item.itemId) && 
          item.saleVelocity * velocityMultiplier > item.currentListings + 1
        )
        .sort((a, b) => b.gilPerGem - a.gilPerGem)
        .slice(0, n);
    };

    // Track items we've already scored
    const scoredItems = new Set<number>();
    
    // Tier 1: Best items (velocity > listings + 1)
    const tier1Items = getTopNItems(calculations, 1, 5, scoredItems);
    tier1Items.forEach(item => {
      const index = calculations.findIndex(calc => calc.itemId === item.itemId);
      if (index !== -1) {
        calculations[index].score = item.gilPerGem * 1000;
        scoredItems.add(item.itemId);
      }
    });

    // Tier 2: Good items (velocity * 2 > listings + 1)
    const tier2Items = getTopNItems(calculations, 2, 5, scoredItems);
    tier2Items.forEach(item => {
      const index = calculations.findIndex(calc => calc.itemId === item.itemId);
      if (index !== -1) {
        calculations[index].score = item.gilPerGem * 100;
        scoredItems.add(item.itemId);
      }
    });

    // Tier 3: Decent items (velocity * 4 > listings + 1)
    const tier3Items = getTopNItems(calculations, 4, 5, scoredItems);
    tier3Items.forEach(item => {
      const index = calculations.findIndex(calc => calc.itemId === item.itemId);
      if (index !== -1) {
        calculations[index].score = item.gilPerGem * 10;
        scoredItems.add(item.itemId);
      }
    });

    // Tier 4: Marginal items (velocity * 8 > listings + 1)
    const tier4Items = getTopNItems(calculations, 8, 5, scoredItems);
    tier4Items.forEach(item => {
      const index = calculations.findIndex(calc => calc.itemId === item.itemId);
      if (index !== -1) {
        calculations[index].score = item.gilPerGem;
        scoredItems.add(item.itemId);
      }
    });

    return calculations;
  };

  return {
    calculations: calculatePrices(),
    isLoading: isLoadingMarket || isLoadingListings,
    error: marketError || listingsError,
  };
};