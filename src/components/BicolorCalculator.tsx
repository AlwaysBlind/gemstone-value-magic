import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { bicolorItems } from "../data/bicolorItems";
import { fetchMarketData } from "../services/universalis";
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
import { Loader2 } from "lucide-react";

const servers = ["Twintania", "Phoenix", "Odin", "Lich", "Zodiark", "Ragnarok", "Cerberus", "Spriggan", "Alpha", "Raiden"];

const BicolorCalculator = () => {
  const [selectedServer, setSelectedServer] = useState("Twintania");

  const { data: marketData, isLoading } = useQuery({
    queryKey: ["marketData", selectedServer],
    queryFn: async () => {
      const itemIds = bicolorItems.map((item) => item.id);
      return fetchMarketData(selectedServer, itemIds);
    },
  });

  const calculatePrices = (): PriceCalculation[] => {
    if (!marketData) return [];

    return bicolorItems
      .map((item) => {
        const itemMarketData = marketData.items[item.id];
        console.log(`Calculating price for ${item.name} (ID: ${item.id}):`, itemMarketData);
        
        // Calculate average price from recent sales
        const recentSales = itemMarketData?.entries?.slice(0, 10) || [];
        console.log(`Recent sales for ${item.name}:`, recentSales);
        
        const averagePrice = recentSales.length > 0
          ? recentSales.reduce((sum, sale) => {
              console.log(`Sale price for ${item.name}: ${sale.pricePerUnit} x ${sale.quantity}`);
              return sum + sale.pricePerUnit;
            }, 0) / recentSales.length
          : 0;
        
        console.log(`Final average price for ${item.name}: ${averagePrice}`);

        return {
          itemId: item.id,
          name: item.name,
          cost: item.cost,
          marketPrice: averagePrice,
          gilPerGem: averagePrice / item.cost,
          saleVelocity: itemMarketData?.regularSaleVelocity || 0,
        };
      })
      .sort((a, b) => b.gilPerGem - a.gilPerGem);
  };

  const calculations = calculatePrices();

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
                <TableHead className="text-ffxiv-gold">Item</TableHead>
                <TableHead className="text-ffxiv-gold text-right">Cost (Gems)</TableHead>
                <TableHead className="text-ffxiv-gold text-right">Market Price</TableHead>
                <TableHead className="text-ffxiv-gold text-right">Gil per Gem</TableHead>
                <TableHead className="text-ffxiv-gold text-right">Sale Velocity</TableHead>
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
                    {calc.marketPrice.toLocaleString()} gil
                  </TableCell>
                  <TableCell className="text-right">
                    {calc.gilPerGem.toLocaleString()} gil
                  </TableCell>
                  <TableCell className="text-right">
                    {calc.saleVelocity.toFixed(1)}/day
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