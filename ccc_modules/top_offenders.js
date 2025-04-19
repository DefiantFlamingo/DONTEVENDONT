const stopWords = new Set([
    'the', 'a', 'an', 'in', 'to', 'for', 'of', 'and', 'is', 'are', 'on', 'at', 'it', 'as'
  ]);
  
  const CCC_TopOffenders = (() => {
    // Function to calculate word frequencies from given text
    function getWordFrequencies(text) {
      const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
      const frequency = {};
      words.forEach(word => {
        if (!stopWords.has(word)) {
          frequency[word] = (frequency[word] || 0) + 1;
        }
      });
      return frequency;
    }
  
    // Function to get sorted offenders based on frequency count
    function getTopOffenders(text, threshold = 2) {
      const frequency = getWordFrequencies(text);
      const offenders = Object.entries(frequency)
        .filter(([word, count]) => count > threshold)
        .map(([word, count]) => ({ word, count }));
  
      // Sort by count descending, then alphabetically
      offenders.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
      return offenders;
    }
  
    // Expose the public API
    return {
      getWordFrequencies,
      getTopOffenders,
    };
  })();
export { CCC_TopOffenders };