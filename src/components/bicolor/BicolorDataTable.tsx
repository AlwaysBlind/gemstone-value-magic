import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { PriceCalculation } from "../../types/ffxiv";
import { formatNumber, formatMarketPrice, formatGilPerGem, formatScore } from "../../utils/formatting";

interface BicolorDataTableProps {
  calculations: PriceCalculation[];
  sortConfig: {
    key: keyof PriceCalculation;
    direction: 'asc' | 'desc';
  };
  onSort: (key: keyof PriceCalculation) => void;
}

const BicolorDataTable = ({ calculations, sortConfig, onSort }: BicolorDataTableProps) => {
  const SortButton = ({ column }: { column: keyof PriceCalculation }) => (
    <Button
      variant="ghost"
      onClick={() => onSort(column)}
      className="h-8 px-2 lg:px-3"
    >
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  return (
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
  );
};

export default BicolorDataTable;