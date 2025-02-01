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
        currentListings: totalListingsQuantity || 1, // Prevent division by zero
        score: 0, // Will be calculated in the ranking phase
      };
    });

    // Filter out items with no market activity
    items = items.filter(item => item.gilPerGem > 0);

    // First step: Sort items based on gil per gem where velocity/listings ratio > 0.5
    const sortedItems = items.sort((a, b) => {
      const aRatio = (a.saleVelocity * 7) / a.currentListings;
      const bRatio = (b.saleVelocity * 7) / b.currentListings;
      
      // Only consider items where ratio > 0.5
      const aQualifies = aRatio > 0.5;
      const bQualifies = bRatio > 0.5;

      if (aQualifies !== bQualifies) {
        return bQualifies ? 1 : -1;
      }

      // If both qualify or both don't qualify, sort by gil per gem
      return b.gilPerGem - a.gilPerGem;
    });

    // Take top 15 items and apply new scoring formula
    const rankedItems = sortedItems.map((item, index) => {
      const weeklySalesVolume = item.saleVelocity * 7;
      if (index < 15 && (weeklySalesVolume / item.currentListings > 0.5)) {
        // New scoring formula: (gpg × weeklySalesVolume) / (listingCount / weeklySalesVolume)
        const score = (item.gilPerGem * weeklySalesVolume) / (item.currentListings / weeklySalesVolume);
        return {
          ...item,
          score: Math.round(score)
        };
      }
      return {
        ...item,
        score: 0
      };
    });

    console.log('Final rankings summary:', 
      rankedItems.slice(0, 15).map(item => ({
        name: item.name,
        saleVelocity: item.saleVelocity,
        currentListings: item.currentListings,
        ratio: (item.saleVelocity * 7) / item.currentListings,
        gilPerGem: item.gilPerGem,
        score: item.score,
        weeklySales: item.saleVelocity * 7
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