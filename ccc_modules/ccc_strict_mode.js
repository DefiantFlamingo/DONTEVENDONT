const CCC_StrictMode = (() => {
    const judgmentalMessages = [
      "Yikes, that one again?",
      "We’ve seen this word too many times. Let it go.",
      "Are you trying to summon it?",
      "It’s officially overused. Please give it a rest.",
      "Redundant? More like relentless.",
      "This word has filed for a restraining order."
    ];
  
    function enableStrictMode(text, frequency, threshold = 2) {
      const flags = [];
  
      Object.entries(frequency).forEach(([word, count]) => {
        if (count > threshold) {
          const message = judgmentalMessages[Math.floor(Math.random() * judgmentalMessages.length)];
          flags.push({ word, count, message });
        }
      });
  
      return flags;
    }
  
    return {
      enableStrictMode,
    };
  })();
  export { CCC_StrictMode };