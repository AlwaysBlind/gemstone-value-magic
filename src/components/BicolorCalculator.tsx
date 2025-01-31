import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bicolorItems } from "../data/bicolorItems";
import { fetchMarketData, fetchCurrentListings } from "../services/universalis";
import { PriceCalculation } from "../types/ffxiv";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const servers = ["Twintania", "Phoenix", "Odin", "Lich", "Zodiark", "Ragnarok", "Cerberus", "Spriggan", "Alpha", "Raiden"];

const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
};

type SortConfig = {
  key: keyof PriceCalculation;
  direction: 'asc' | 'desc';
};

const BicolorCalculator = () => {
  const [selectedServer, setSelectedServer] = useState("Twintania");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'score', 
    direction: 'desc' 
  });

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

    return bicolorItems
      .map((item) => {
        console.log(`Processing item ${item.name} (ID: ${item.id})`);
        const itemMarketData = marketData.items[item.id];
        const currentListingData = currentListings.results.find(r => r.itemId === item.id);
        
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
            score: 0
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
            score: 0
          };
        }
        
        let totalPrice = 0;
        let totalQuantity = 0;
        
        recentSales.forEach(sale => {
          totalPrice += sale.pricePerUnit * sale.quantity;
          totalQuantity += sale.quantity;
        });
        
        const averagePrice = totalQuantity > 0 ? Math.round(totalPrice / totalQuantity) : 0;
        const gilPerGem = Math.round(averagePrice / item.cost);
        const saleVelocity = itemMarketData.regularSaleVelocity || 0;
        const currentListingsCount = currentListingData?.nq?.minListing?.world?.price ? 1 : 0;
        
        console.log(`Calculated values for ${item.name}:`, {
          averagePrice,
          gilPerGem,
          saleVelocity,
          currentListingsCount
        });
        
        // Modified score calculation with null/undefined checks
        let score;
        if (currentListingsCount === null || currentListingsCount === undefined || 
            saleVelocity === null || saleVelocity === undefined || 
            currentListingsCount === 0 || saleVelocity === 0) {
          score = gilPerGem; // Return just the gil per gem when either value is null/undefined/0
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
          score: score
        };
      });
  };

  const sortData = (data: PriceCalculation[]): PriceCalculation[] => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  const handleSort = (key: keyof PriceCalculation) => {
    setSortConfig((currentConfig) => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === 'desc'
          ? 'asc'
          : 'desc',
    }));
  };

  const calculations = sortData(calculatePrices());

  const formatMarketPrice = (calculation: PriceCalculation): string => {
    if (calculation.marketPrice === -1) return "No data available";
    if (calculation.marketPrice === 0) return "No recent sales";
    return `${formatNumber(Math.round(calculation.marketPrice))} gil`;
  };

  const formatGilPerGem = (calculation: PriceCalculation): string => {
    if (calculation.marketPrice <= 0) return "-";
    return `${formatNumber(Math.round(calculation.gilPerGem))} gil`;
  };

  const formatScore = (calculation: PriceCalculation): string => {
    if (calculation.marketPrice <= 0) return "-";
    return formatNumber(calculation.score);
  };

  const SortButton = ({ column }: { column: keyof PriceCalculation }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(column)}
      className="h-8 px-2 lg:px-3"
    >
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  const isLoading = isLoadingMarket || isLoadingListings;
  const error = marketError || listingsError;

  if (error) {
    console.error("Error loading data:", error);
    return (
      <Card className="w-full max-w-4xl mx-auto bg-ffxiv-blue text-white">
        <CardHeader>
          <CardTitle className="text-ffxiv-gold text-2xl text-center">
            Error Loading Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-red-400">
            Failed to load market data. Please try again later.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto bg-ffxiv-blue text-white">
      <CardHeader>
        <CardTitle className="text-ffxiv-gold text-2xl text-center">
          FFXIV Bicolor Gemstone Calculator
        </CardTitle>
        <div className="flex justify-center mt-4">
          <Select value={selectedServer} onValueChange={setSelectedServer}>
            <SelectTrigger className="w-48 bg-ffxiv-accent text-white">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              {servers.map((server) => (
                <SelectItem key={server} value={server}>
                  {server}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-ffxiv-gold" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-ffxiv-gold">
                  Item
                  <SortButton column="name" />
                </TableHead>
                <TableHead className="text-ffxiv-gold text-right">
                  Cost (Gems)
                  <SortButton column="cost" />
                </TableHead>
                <TableHead className="text-ffxiv-gold text-right">
                  Market Price
                  <SortButton column="marketPrice" />
                </TableHead>
                <TableHead className="text-ffxiv-gold text-right">
                  Gil per Gem
                  <SortButton column="gilPerGem" />
                </TableHead>
                <TableHead className="text-ffxiv-gold text-right">
                  Sale Velocity
                  <SortButton column="saleVelocity" />
                </TableHead>
                <TableHead className="text-ffxiv-gold text-right">
                  Current Listings
                  <SortButton column="currentListings" />
                </TableHead>
                <TableHead className="text-ffxiv-gold text-right">
                  Score
                  <SortButton column="score" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculations.map((calc) => (
                <TableRow key={calc.itemId}>
                  <TableCell className="font-medium">
                    <a
                      href={`https://universalis.app/market/${calc.itemId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ffxiv-gold hover:underline"
                    >
                      {calc.name}
                    </a>
                  </TableCell>
                  <TableCell className="text-right">{calc.cost}</TableCell>
                  <TableCell className="text-right">
                    {formatMarketPrice(calc)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatGilPerGem(calc)}
                  </TableCell>
                  <TableCell className="text-right">
                    {calc.saleVelocity.toFixed(1)}/day
                  </TableCell>
                  <TableCell className="text-right">
                    {calc.currentListings || 0}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatScore(calc)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default BicolorCalculator;