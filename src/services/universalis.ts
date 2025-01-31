export const fetchMarketData = async (worldName: string, itemIds: number[]) => {
  console.log("Fetching market history data for world:", worldName, "items:", itemIds);
  const response = await fetch(
    `https://universalis.app/api/v2/history/${worldName}/${itemIds.join(",")}`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch market data");
  }
  
  const data = await response.json();
  console.log("Received market history data:", data);
  return data;
};