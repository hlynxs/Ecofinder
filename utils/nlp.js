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
  // Plastics & synthetics
  "plastic", "polyester", "nylon", "acrylic", "vinyl", "polyethylene", "polypropylene", "foam", "synthetic leather", "microplastics", "plasticizer", "pvc",
  
  // Chemicals / finishes / treatments
  "petrochemical", "chemical finish", "coated", "lacquered", "dyed with synthetic dyes", "flame-retardant chemicals",
  
  // Non-biodegradable / non-recyclable
  "non-recyclable", "non-biodegradable", "single-use", "disposable",
  
  // Greenwashing / misleading claims
  "looks good on the shelf", "pretends to be eco", "not really sustainable", "marketing hype", "superficially green",
  ];


function hasKeywordWithNegation(text, keywords) {
  const words = text.split(/\W+/); // split by non-word chars
  for (let i = 0; i < words.length; i++) {
    for (const kw of keywords) {
      const kwParts = kw.toLowerCase().split(' ');
      let match = true;
      for (let j = 0; j < kwParts.length; j++) {
        if (words[i + j] !== kwParts[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        const prevWord = words[i - 1] || '';
        if (['not', "n't", 'no'].includes(prevWord)) {
          continue; // skip if negated
        }
        return true;
      }
    }
  }
  return false;
}

async function isEcoFriendly(description) {
  const model = await loadModel();
  const text = description.toLowerCase();

  // Negation-aware checks
  const hasEco = hasKeywordWithNegation(text, ecoKeywords);
  const hasNonEco = hasKeywordWithNegation(text, nonEcoIndicators);

  // Transformer sentiment/contextual analysis
  const result = await model(description);
  const isPositive = result[0].label === 'POSITIVE';

  // Logic: tricky negatives override positive sentiment
  if (hasNonEco) return 0;

  // Only mark as eco-friendly if positive keywords exist and sentiment is positive
  if (hasEco && isPositive) return 1;

  return 0;
}

module.exports = { isEcoFriendly };
