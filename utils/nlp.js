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
  "looks good on the shelf", "pretends to be eco", "not really sustainable", "marketing hype", "superficially green"
];

// Eco-friendly materials
const ecoMaterials = [
  "bamboo", "cork", "organic cotton", "hemp", "jute", "linen",
  "reclaimed wood", "rattan", "coir", "rice husk", "soy-based", "plant-based leather",
  "paper", "cardboard", "natural rubber", "silk", "wool"
];

// Check for keywords with negation handling
function hasKeywordWithNegation(text, keywords) {
  const words = text.split(/\W+/);
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

// Check if any eco-friendly material exists in text
function hasEcoMaterial(text) {
  const words = text.toLowerCase().split(/\W+/);
  for (const mat of ecoMaterials) {
    const matParts = mat.split(' ');
    for (let i = 0; i <= words.length - matParts.length; i++) {
      let match = true;
      for (let j = 0; j < matParts.length; j++) {
        if (words[i + j] !== matParts[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }
  }
  return false;
}

// Main function to check if a product description is eco-friendly
async function isEcoFriendly(description) {
  const model = await loadModel();
  const text = description.toLowerCase();

  const hasEco = hasKeywordWithNegation(text, ecoKeywords);
  const hasNonEco = hasKeywordWithNegation(text, nonEcoIndicators);
  const hasMaterial = hasEcoMaterial(text);

  // Transformer sentiment analysis
  const result = await model(description);
  const isPositive = result[0].label === 'POSITIVE';

  // Tricky negatives override all
  if (hasNonEco) return 0;

  // Eco if positive keywords OR eco-friendly material present AND sentiment positive
  if ((hasEco || hasMaterial) && isPositive) return 1;

  return 0;
}

module.exports = { isEcoFriendly };
