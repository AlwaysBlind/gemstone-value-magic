const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const fetchMarketData = async (worldName: string, itemIds: number[]) => {
  console.log("Fetching market history data for world:", worldName, "items:", itemIds);
  
  // Split itemIds into chunks of 60
  const chunks = chunkArray(itemIds, 60);
  console.log("Split items into chunks:", chunks.length, "chunks");
  
  let mergedData = {
    items: {},
    worldName: worldName
  };
  
  // Process each chunk sequentially
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    console.log(`Processing chunk ${i + 1}/${chunks.length}, items:`, chunk);
    
    const response = await fetch(
      `https://universalis.app/api/v2/history/${worldName}/${chunk.join(",")}`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch market data for chunk ${i + 1}`);
    }
    
    const chunkData = await response.json();
    console.log(`Received data for chunk ${i + 1}:`, chunkData);
    
    // Merge chunk data into the combined result
    mergedData.items = { ...mergedData.items, ...chunkData.items };
  }
  
  console.log("Final merged market history data:", mergedData);
  return mergedData;
};