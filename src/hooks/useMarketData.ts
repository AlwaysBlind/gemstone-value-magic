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

    return bicolorItems.map((item) => {
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
          score: 0,
        };
      }

      let totalPrice = 0;
      let totalQuantity = 0;

      recentSales.forEach((sale) => {
        totalPrice += sale.pricePerUnit * sale.quantity;
        totalQuantity += sale.quantity;
      });

      const averagePrice =
        totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;
      const gilPerGem = Math.round(averagePrice / item.cost);
      const saleVelocity = itemMarketData.regularSaleVelocity || 0;
      const currentListingsCount = currentListingData?.listings?.length || 0;

      // New score calculation logic
      let score = 0;
      if (currentListingsCount > 0) {
        const velocityToListingsRatio = saleVelocity / currentListingsCount;
        if (velocityToListingsRatio > 2 && saleVelocity > 1) {
          score = gilPerGem;
        }
      }

      return {
        itemId: item.id,
        name: item.name,
        cost: item.cost,
        marketPrice: averagePrice,
        gilPerGem: gilPerGem,
        saleVelocity: saleVelocity,
        currentListings: currentListingsCount,
        score: score,
      };
    });
  };

  return {
    calculations: calculatePrices(),
    isLoading: isLoadingMarket || isLoadingListings,
    error: marketError || listingsError,
  };
};