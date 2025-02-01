import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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

  const calculations = useMemo(() => {
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

      // Calculate total quantity from all current listings
      const totalListingsQuantity = currentListingData?.listings?.reduce((sum, listing) => {
        return sum + listing.quantity;
      }, 0) || 0;

      const averagePrice = totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;
      const gilPerGem = Math.round(averagePrice / item.cost);
      const saleVelocity = itemMarketData.regularSaleVelocity || 0;

      return {
        itemId: item.id,
        name: item.name,
        cost: item.cost,
        marketPrice: averagePrice,
        gilPerGem: gilPerGem,
        saleVelocity: saleVelocity,
        currentListings: totalListingsQuantity,
        score: 4, // Starting with tier 4 as default
      };
    });

    // Filter out items with no market activity
    items = items.filter(item => item.gilPerGem > 0);

    // Sort items based on two criteria:
    // 1. Whether they meet the velocity requirement (sales velocity >= current listings)
    // 2. Their gil per gem value
    const sortedItems = items.sort((a, b) => {
      const aQualifies = (a.saleVelocity * 4) >= (a.currentListings + 1) ? 1 : 0;
      const bQualifies = (b.saleVelocity * 4) >= (b.currentListings + 1) ? 1 : 0;

      // If qualification status differs, prioritize qualified items
      if (aQualifies !== bQualifies) {
        return bQualifies - aQualifies;
      }
      
      // If both items have the same qualification status, sort by gil per gem
      return b.gilPerGem - a.gilPerGem;
    });

    // Assign ranks starting from 4
    const rankedItems = sortedItems.map((item, index) => ({
      ...item,
      score: index + 4
    }));

    console.log('Final rankings summary:', 
      rankedItems.slice(0, 10).map(item => ({
        name: item.name,
        saleVelocity: item.saleVelocity,
        currentListings: item.currentListings,
        gilPerGem: item.gilPerGem,
        score: item.score
      }))
    );

    return rankedItems;
  }, [marketData, currentListings]);

  return {
    calculations,
    isLoading: isLoadingMarket || isLoadingListings,
    error: marketError || listingsError,
  };
};