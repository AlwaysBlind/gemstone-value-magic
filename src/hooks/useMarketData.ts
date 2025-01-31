import { useQuery } from "@tanstack/react-query";
import { fetchMarketData, fetchCurrentListings } from "../services/universalis";
import { bicolorItems } from "../data/bicolorItems";
import { PriceCalculation } from "../types/ffxiv";

export const useMarketData = (selectedServer: string) => {
  const { data: marketData, isLoading: isLoadingMarket, error: marketError } = useQuery({
    queryKey: ["marketData", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      console.log("Fetching market data for items:", itemIds);
      const data = await fetchMarketData(selectedServer, itemIds);
      console.log("Raw market data received:", data);
      return data;
    },
  });

  const { data: currentListings, isLoading: isLoadingListings, error: listingsError } = useQuery({
    queryKey: ["currentListings", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      console.log("Fetching current listings for items:", itemIds);
      const data = await fetchCurrentListings(selectedServer, itemIds);
      console.log("Current listings data received:", data);
      return data;
    },
  });

  const calculatePrices = (): PriceCalculation[] => {
    console.log("Starting calculatePrices with marketData:", marketData);
    console.log("and currentListings:", currentListings);

    if (!marketData || !currentListings?.results) {
      console.log("No market data or current listings available yet");
      return [];
    }

    return bicolorItems.map((item) => {
      console.log(`Processing item ${item.name} (ID: ${item.id})`);
      const itemMarketData = marketData.items[item.id];
      const currentListingData = currentListings.results.find(
        (r) => r.itemId === item.id
      );

      console.log(`Market data for item ${item.id}:`, itemMarketData);
      console.log(`Current listing data for item ${item.id}:`, currentListingData);

      if (!itemMarketData || !itemMarketData.entries) {
        console.log(`No market data found for ${item.name} (ID: ${item.id})`);
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
        console.log(`No sales history found for ${item.name} (ID: ${item.id})`);
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
      const currentListingsCount = currentListingData?.nq?.minListing?.world?.price
        ? 1
        : 0;

      console.log(`Calculated values for ${item.name}:`, {
        averagePrice,
        gilPerGem,
        saleVelocity,
        currentListingsCount,
      });

      let score;
      if (
        currentListingsCount === null ||
        currentListingsCount === undefined ||
        saleVelocity === null ||
        saleVelocity === undefined ||
        currentListingsCount === 0 ||
        saleVelocity === 0
      ) {
        score = gilPerGem;
      } else {
        score = Math.round(gilPerGem / (currentListingsCount / saleVelocity));
      }

      console.log(`Final score for ${item.name}: ${score}`);

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