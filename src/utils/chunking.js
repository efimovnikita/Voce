/**
 * Splits a long text into chunks that fit within a character limit,
 * trying to preserve sentence boundaries.
 * 
 * @param {string} text - The text to split.
 * @param {number} maxChunkLength - Maximum number of characters per chunk.
 * @returns {string[]} - Array of text chunks.
 */
export const splitIntoChunks = (text, maxChunkLength = 2000) => {
  if (!text) return [];

  // Split by common sentence terminators (. ! ?)
  // Keeping the terminator with the sentence using lookbehind if supported, 
  // but for broad compatibility we split and then re-join carefully.
  const sentences = text.match(/[^.!?]+[.!?]*|[^.!?]+/g) || [];
  
  const chunks = [];
  let currentChunk = '';

  for (let sentence of sentences) {
    sentence = sentence.trim();
    if (!sentence) continue;

    // If a single sentence is longer than maxChunkLength, split it by character limit
    if (sentence.length > maxChunkLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      let remaining = sentence;
      while (remaining.length > 0) {
        let chunkPart = remaining.substring(0, maxChunkLength);
        
        // Try to split at the last space within the chunkPart to avoid cutting words
        if (remaining.length > maxChunkLength) {
          const lastSpace = chunkPart.lastIndexOf(' ');
          if (lastSpace > 0) {
            chunkPart = remaining.substring(0, lastSpace);
          }
        }
        
        chunks.push(chunkPart.trim());
        remaining = remaining.substring(chunkPart.length).trim();
      }
      continue;
    }

    // Check if adding the next sentence exceeds the limit
    if ((currentChunk + ' ' + sentence).trim().length > maxChunkLength) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
};
