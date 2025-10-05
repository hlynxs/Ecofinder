const { pipeline } = require('@xenova/transformers');

let classifier = null;

// Lazy-load transformer model
async function loadModel() {
  if (!classifier) {
    classifier = await pipeline(
      'text-classification',
      'Xenova/distilbert-base-uncased-finetuned-sst-2-english'
    );
  }
  return classifier;
}

// Positive eco keywords
const ecoKeywords = [
  "recyclable", "eco friendly", "eco-friendly", "biodegradable",
  "sustainable", "compostable", "organic", "low carbon footprint",
  "reusable", "environmentally friendly", "natural materials"
];

// Negative/tricky indicators
const nonEcoIndicators = [
  "plastic", "synthetic", "polyester", "nylon", "acrylic",
  "vinyl", "petrochemical", "chemical finish", "coated",
  "pretends", "not really", "looks good on the shelf"
];

async function isEcoFriendly(description) {
  const model = await loadModel();
  const text = description.toLowerCase();

  // Check keywords
  const hasEco = ecoKeywords.some(k => text.includes(k));
  const hasNonEco = nonEcoIndicators.some(k => text.includes(k));

  // Transformer sentiment/contextual analysis
  const result = await model(description);

  // POSITIVE label = eco-friendly, NEGATIVE label = non eco-friendly
  const isPositive = result[0].label === 'POSITIVE';

  // Logic: if it has tricky negative indicators, treat as non-eco even if positive sentiment
  if (hasNonEco) return 0;

  // Only mark as eco-friendly if positive keywords exist, no negative indicators, and sentiment is positive
  if (hasEco && isPositive) return 1;

  return 0;
}

module.exports = { isEcoFriendly };
