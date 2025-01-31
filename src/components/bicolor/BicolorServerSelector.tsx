import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const servers = ["Twintania", "Phoenix", "Odin", "Lich", "Zodiark", "Ragnarok", "Cerberus", "Spriggan", "Alpha", "Raiden"];

interface BicolorServerSelectorProps {
  selectedServer: string;
  onServerChange: (server: string) => void;
}

const BicolorServerSelector = ({ selectedServer, onServerChange }: BicolorServerSelectorProps) => (
  <Select value={selectedServer} onValueChange={onServerChange}>
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
);

export default BicolorServerSelector;