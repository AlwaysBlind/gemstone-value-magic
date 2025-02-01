import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, HelpCircle } from "lucide-react";
import { PriceCalculation } from "../../types/ffxiv";
import { formatNumber, formatMarketPrice, formatGilPerGem, formatScore } from "../../utils/formatting";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const HeaderWithTooltip = ({ label, tooltip }: { label: string; tooltip: string }) => (
    <div className="flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-3.5 w-3.5 text-ffxiv-gold/40 hover:text-ffxiv-gold/70 transition-colors cursor-help" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );

  const getSaleSpeedClass = (currentListings: number, saleVelocity: number) => {
    const ratio = currentListings / saleVelocity;
    if (ratio < 2) return "bg-emerald-950/20 hover:bg-emerald-950/30";
    if (ratio >= 2 && ratio <= 14) return "bg-amber-950/20 hover:bg-amber-950/30";
    return "bg-red-950/20 hover:bg-red-950/30";
  };

  const getMarketSaturationBadge = (saleVelocity: number) => {
    if (saleVelocity > 100) {
      return <Badge className="bg-ffxiv-blue text-ffxiv-gold hover:bg-ffxiv-accent">High Volume</Badge>;
    }
    if (saleVelocity >= 10) {
      return <Badge className="bg-ffxiv-accent text-ffxiv-gold hover:bg-ffxiv-blue">Good Volume</Badge>;
    }
    if (saleVelocity >= 1) {
      return <Badge className="bg-ffxiv-gold/20 text-ffxiv-gold hover:bg-ffxiv-gold/30">Limited Volume</Badge>;
    }
    return <Badge className="bg-red-900/50 text-ffxiv-gold hover:bg-red-900/70">Very Limited</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-ffxiv-gold">
            <HeaderWithTooltip 
              label="Item" 
              tooltip="The name of the item that can be purchased with Bicolor Gemstones" 
            />
            <SortButton column="name" />
          </TableHead>
          <TableHead className="text-ffxiv-gold text-right">
            <HeaderWithTooltip 
              label="Cost (Gems)" 
              tooltip="The number of Bicolor Gemstones required to purchase this item" 
            />
            <SortButton column="cost" />
          </TableHead>
          <TableHead className="text-ffxiv-gold text-right">
            <HeaderWithTooltip 
              label="Market Price" 
              tooltip="The current average market price for this item on your selected server" 
            />
            <SortButton column="marketPrice" />
          </TableHead>
          <TableHead className="text-ffxiv-gold text-right">
            <HeaderWithTooltip 
              label="Gil per Gem" 
              tooltip="The amount of gil you can expect to earn per Bicolor Gemstone spent" 
            />
            <SortButton column="gilPerGem" />
          </TableHead>
          <TableHead className="text-ffxiv-gold text-right">
            <HeaderWithTooltip 
              label="Sale Velocity" 
              tooltip="The average number of items sold per day over the last week. The badge indicates how many items you can safely list before saturating the market." 
            />
            <SortButton column="saleVelocity" />
          </TableHead>
          <TableHead className="text-ffxiv-gold text-right">
            <HeaderWithTooltip 
              label="Current Listings" 
              tooltip="The number of items currently listed on the market board" 
            />
            <SortButton column="currentListings" />
          </TableHead>
          <TableHead className="text-ffxiv-gold text-right">
            <HeaderWithTooltip 
              label="Score" 
              tooltip="A sophisticated ranking system that evaluates items in tiers. Each tier considers items where (Sale Velocity × Tier) ≥ (Current Listings + 1). The top 5 items in each tier receive a score based on their Gil per Gem value, multiplied by a tier-specific factor. Higher tiers have larger multipliers, ensuring the most profitable and fast-selling items appear at the top when sorted." 
            />
            <SortButton column="score" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {calculations.map((calc) => (
          <TableRow 
            key={calc.itemId}
            className={getSaleSpeedClass(calc.currentListings || 1, calc.saleVelocity)}
          >
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
              <div className="flex items-center justify-end gap-2">
                <span>{calc.saleVelocity.toFixed(1)}/day</span>
                {getMarketSaturationBadge(calc.saleVelocity)}
              </div>
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