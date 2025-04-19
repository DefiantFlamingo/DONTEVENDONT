export function CCC_BanList(text) {
  const bannedPhrases = [
    "she set her jaw",
    "he let out a breath he didn’t know he was holding",
    "with a twinkle in his eye",
    "tone set to neutral",
    "his smile didn’t reach his eyes",
    "furrowed her brow",
    "a flicker of something",
    "retorted",
    "sighed and said",
    "somehow, impossibly",
    "for reasons she couldn't explain"
  ];

  const loweredText = text.toLowerCase();
  const results = [];

  bannedPhrases.forEach((phrase) => {
    if (loweredText.includes(phrase)) {
      results.push(`⚠️ Banned: "${phrase}"`);
    }
  });

  return results;
}