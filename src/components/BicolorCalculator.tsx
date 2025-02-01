import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceCalculation } from "../types/ffxiv";
import BicolorServerSelector from "./bicolor/BicolorServerSelector";
import BicolorDataTable from "./bicolor/BicolorDataTable";
import { useMarketData } from "../hooks/useMarketData";

type SortConfig = {
  key: keyof PriceCalculation;
  direction: "asc" | "desc";
};

const BicolorCalculator = () => {
  const [selectedServer, setSelectedServer] = useState("Twintania");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "score",
    direction: "asc",
  });

  const { calculations, isLoading, error } = useMarketData(selectedServer);

  const sortData = (data: PriceCalculation[]): PriceCalculation[] => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });
  };

  const handleSort = (key: keyof PriceCalculation) => {
    setSortConfig((currentConfig) => ({
      key,
      direction:
        currentConfig.key === key && currentConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

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
          <BicolorServerSelector
            selectedServer={selectedServer}
            onServerChange={setSelectedServer}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-ffxiv-gold" />
          </div>
        ) : (
          <BicolorDataTable
            calculations={sortData(calculations)}
            sortConfig={sortConfig}
            onSort={handleSort}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default BicolorCalculator;