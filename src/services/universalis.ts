const CHUNK_SIZE = 100;

const chunkArray = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const fetchMarketData = async (worldName: string, itemIds: number[]) => {
  console.log(`Fetching market history data for world: ${worldName}, total items:`, itemIds.length);
  
  const chunks = chunkArray(itemIds, CHUNK_SIZE);
  console.log(`Split into ${chunks.length} chunks of ${CHUNK_SIZE} items each`);
  
  try {
    const responses = await Promise.all(
      chunks.map(async (chunk) => {
        console.log(`Fetching chunk with ${chunk.length} items:`, chunk);
        const response = await fetch(
          `https://universalis.app/api/v2/history/${worldName}/${chunk.join(",")}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch market data for chunk: ${response.statusText}`);
        }
        
        return response.json();
      })
    );
    
    // Merge all chunk responses into a single response
    const mergedData = responses.reduce((acc, curr) => {
      return {
        items: { ...acc.items, ...curr.items },
        worldName: curr.worldName,
      };
    });
    
    console.log("Successfully merged all chunk responses");
    return mergedData;
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw error;
  }
};