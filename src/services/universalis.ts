const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const fetchCurrentListings = async (worldName: string, itemIds: number[]) => {
  const response = await fetch(
    `https://universalis.app/api/v2/${worldName}/${itemIds.join(",")}`
  );
  
  if (!response.ok) {
    throw new Error("Failed to fetch current listings");
  }
  
  const data = await response.json();
  return data;
};

export const fetchMarketData = async (worldName: string, itemIds: number[]) => {
  const chunks = chunkArray(itemIds, 60);
  
  let mergedData = {
    items: {},
    worldName: worldName
  };
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    const response = await fetch(
      `https://universalis.app/api/v2/history/${worldName}/${chunk.join(",")}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market data for chunk ${i + 1}`);
    }
    
    const chunkData = await response.json();
    mergedData.items = { ...mergedData.items, ...chunkData.items };
  }
  
  return mergedData;
};