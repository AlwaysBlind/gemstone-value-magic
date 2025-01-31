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

  const { data: marketData, isLoading: isLoadingMarket } = useQuery({
    queryKey: ["marketData", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      console.log("Fetching market data for items:", itemIds);
      const data = await fetchMarketData(selectedServer, itemIds);
      console.log("Raw market data received:", data);
      return data;
    },
  });

  const { data: currentListings, isLoading: isLoadingListings } = useQuery({
    queryKey: ["currentListings", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      return fetchCurrentListings(selectedServer, itemIds);
    },
  });

  const calculatePrices = (): PriceCalculation[] => {
    if (!marketData || !currentListings) return [];

    return bicolorItems
      .map((item) => {
        const itemMarketData = marketData.items[item.id];
        const currentListingData = currentListings.results.find(r => r.itemId === item.id);
        
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
        
        // New score calculation: gilPerGem / (currentListings / saleVelocity)
        const score = currentListingsCount > 0 && saleVelocity > 0
          ? Math.round(gilPerGem / (currentListingsCount / saleVelocity))
          : 0;

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
        {isLoadingMarket || isLoadingListings ? (
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