// A simple Levenshtein distance function
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function findRangeByFuzzyMatch(
  text: string,
  allTextNodes: { text: string | null }[],
): {
  startNodeIndex: number;
  startOffset: number;
  endNodeIndex: number;
  endOffset: number;
} | null {
  const fullText = allTextNodes.map((node) => node.text).join("");
  const trimmedText = text.trim();
  let startIndex = -1;
  let effectiveSearchText = "";

  // 1. Try exact match for original text
  const originalIndex = fullText.indexOf(text);
  if (originalIndex !== -1) {
    startIndex = originalIndex;
    effectiveSearchText = text;
  }

  // 2. If not found, try with trimmed text
  if (startIndex === -1) {
    const trimmedIndex = fullText.indexOf(trimmedText);
    if (trimmedIndex !== -1) {
      startIndex = trimmedIndex;
      effectiveSearchText = trimmedText;
    }
  }

  // 3. If still not found, use Levenshtein distance
  if (startIndex === -1 && trimmedText.length > 0) {
    // 3. If still not found, use a smarter fuzzy search that is more performant
    if (startIndex === -1 && trimmedText.length > 0) {
      const threshold = 5; // Allow up to 5 edits
      let minDistance = Infinity;
      let bestMatchIndex = -1;

      // --- Smart Seed Selection ---
      const words = trimmedText.split(/\s+/).filter(Boolean); // Get all non-empty words
      // Prefer longer words with actual letters as seeds
      const alphaNumWords = words.filter(
        (w) => w.length > 3 && /[a-zA-Z]/.test(w),
      );
      const seedSource = alphaNumWords.length > 0 ? alphaNumWords : words;
      const seed =
        seedSource.reduce((a, b) => (a.length >= b.length ? a : b), "") || "";

      // --- Seed-based Search Loop ---
      if (seed) {
        let fromIndex = 0;
        let iterations = 0;
        const MAX_ITERATIONS = 500; // Safety brake for the while loop

        while ((fromIndex = fullText.indexOf(seed, fromIndex)) !== -1) {
          if (++iterations > MAX_ITERATIONS) {
            console.warn("Fuzzy search loop limit reached.");
            break;
          }

          // Define a search window around the found seed
          const windowSize = trimmedText.length * 2;
          const windowStart = Math.max(
            0,
            fromIndex - Math.floor(trimmedText.length / 2),
          );
          const searchWindow = fullText.substring(
            windowStart,
            windowStart + windowSize,
          );

          if (searchWindow.length < trimmedText.length) {
            fromIndex++;
            continue;
          }

          // Run Levenshtein on this smaller window to find the best fit
          for (let i = 0; i <= searchWindow.length - trimmedText.length; i++) {
            const sub = searchWindow.substring(i, i + trimmedText.length);
            const distance = levenshtein(trimmedText, sub);
            if (distance < minDistance) {
              minDistance = distance;
              bestMatchIndex = windowStart + i; // Index relative to fullText
            }
            if (distance === 0) break; // Perfect match
          }

          if (minDistance === 0) break; // Break outer loop if perfect match found
          fromIndex++; // Continue searching for seed from the next position
        }
      }

      if (minDistance <= threshold) {
        startIndex = bestMatchIndex;
        effectiveSearchText = trimmedText;
      }
    }
  }

  if (startIndex === -1) {
    return null;
  }

  const endIndex = startIndex + effectiveSearchText.length;

  let startNodeIndex = -1,
    endNodeIndex = -1;
  let startOffset = 0,
    endOffset = 0;
  let currentIndex = 0;

  for (let i = 0; i < allTextNodes.length; i++) {
    const node = allTextNodes[i];
    const nodeLength = node.text?.length || 0;
    if (startNodeIndex === -1 && startIndex < currentIndex + nodeLength) {
      startNodeIndex = i;
      startOffset = startIndex - currentIndex;
    }
    if (endNodeIndex === -1 && endIndex <= currentIndex + nodeLength) {
      endNodeIndex = i;
      endOffset = endIndex - currentIndex;
      break;
    }
    currentIndex += nodeLength;
  }

  if (startNodeIndex !== -1 && endNodeIndex !== -1) {
    return { startNodeIndex, startOffset, endNodeIndex, endOffset };
  }

  return null;
}

self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === "SCAN_PAGE") {
    const { notes, textNodes } = payload;
    const matched = [];
    const orphaned = [];

    for (const note of notes) {
      const match = findRangeByFuzzyMatch(
        note.anchor.decompressedQuote,
        textNodes,
      );
      if (match) {
        matched.push({ note, match });
      } else {
        orphaned.push(note);
      }
    }

    self.postMessage({
      type: "SCAN_COMPLETE",
      payload: { matched, orphaned },
    });
  }
};

export {};
