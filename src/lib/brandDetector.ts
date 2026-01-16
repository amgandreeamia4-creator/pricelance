// src/lib/brandDetector.ts
// Simple brand detection from product names

// Common tech brands list (can be expanded)
const KNOWN_BRANDS = [
  // Major tech brands
  'Apple', 'Samsung', 'Dell', 'HP', 'Lenovo', 'Asus', 'LG', 'Sony', 'Microsoft',
  'Acer', 'MSI', 'Toshiba', 'Fujitsu', 'Panasonic', 'Sharp', 'Xiaomi', 'Huawei',
  'Oppo', 'Vivo', 'OnePlus', 'Realme', 'Nokia', 'Motorola', 'Google', 'HTC',
  
  // PC/Laptop specific
  'Razer', 'Gigabyte', 'ASRock', 'Biostar', 'EVGA', 'NZXT', 'Corsair', 'Cooler Master',
  'Thermaltake', 'Phanteks', 'Lian Li', 'Fractal Design', 'Be Quiet!', 'Noctua',
  
  // Audio/Headphones
  'Bose', 'Sennheiser', 'Audio-Technica', 'Sony', 'JBL', 'Harman Kardon', 'Bang & Olufsen',
  'Marshall', 'Skullcandy', 'Beats', 'Plantronics', 'Logitech', 'Razer',
  
  // Monitor/Display
  'Dell', 'LG', 'Samsung', 'ASUS', 'BenQ', 'AOC', 'Philips', 'ViewSonic', 'NEC',
  
  // Storage
  'Western Digital', 'WD', 'Seagate', 'Toshiba', 'Kingston', 'SanDisk', 'Crucial',
  'Samsung', 'Intel', 'AMD',
  
  // Components
  'Intel', 'AMD', 'NVIDIA', 'AMD Radeon', 'GeForce', 'Radeon',
  
  // Mobile accessories
  'Anker', 'Belkin', 'Mophie', 'OtterBox', 'Spigen', 'UAG', 'Caseology',
  
  // Gaming
  'Nintendo', 'PlayStation', 'Xbox', 'Steam', 'Epic Games',
  
  // Smart home
  'Amazon', 'Echo', 'Alexa', 'Google Nest', 'Philips Hue', 'Ring',
  
  // Romanian/European brands
  'Allview', 'Evo', 'Cat', 'Alcatel', 'Wiko', 'MyPhone',
  
  // Generic brands that might appear
  'NovaTech', 'TechBrand', 'Digital', 'Smart', 'Pro', 'Max', 'Ultra', 'Elite'
];

/**
 * Detects brand from a product name using known brand patterns
 * @param productName - The product name to analyze
 * @returns The detected brand or null if no brand is found
 */
export function detectBrandFromName(productName: string): string | null {
  if (!productName || typeof productName !== 'string') {
    return null;
  }

  const name = productName.trim();
  
  // Check for exact brand matches first (case-insensitive)
  for (const brand of KNOWN_BRANDS) {
    // Create a regex that matches the brand as a whole word
    const brandRegex = new RegExp(`\\b${brand}\\b`, 'i');
    if (brandRegex.test(name)) {
      return brand;
    }
  }

  // Try to extract brand from the beginning of the name
  // Many products start with brand name followed by model number
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    const firstWord = words[0];
    const secondWord = words[1];
    
    // Check if first word is a known brand
    if (KNOWN_BRANDS.some(brand => brand.toLowerCase() === firstWord.toLowerCase())) {
      return firstWord;
    }
    
    // Check if first two words form a known brand (e.g., "Western Digital")
    const twoWordBrand = `${firstWord} ${secondWord}`;
    if (KNOWN_BRANDS.some(brand => brand.toLowerCase() === twoWordBrand.toLowerCase())) {
      return twoWordBrand;
    }
  }

  // Try to detect brand patterns (common in product names)
  // Look for capitalized words that might be brands
  const capitalizedWords = name.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (capitalizedWords) {
    for (const word of capitalizedWords) {
      if (KNOWN_BRANDS.some(brand => brand.toLowerCase() === word.toLowerCase())) {
        return word;
      }
    }
  }

  // If no known brand is found, return null
  return null;
}

/**
 * Gets a fallback brand when no brand can be detected
 * @param productName - The product name to analyze
 * @returns A fallback brand name
 */
export function getFallbackBrand(productName: string): string {
  const detected = detectBrandFromName(productName);
  if (detected) {
    return detected;
  }
  
  // Generic fallbacks based on common product patterns
  const name = productName.toLowerCase();
  
  if (name.includes('laptop') || name.includes('notebook')) {
    return 'Generic Laptop';
  }
  
  if (name.includes('phone') || name.includes('smartphone') || name.includes('mobile')) {
    return 'Generic Phone';
  }
  
  if (name.includes('headphone') || name.includes('earbud') || name.includes('earphone')) {
    return 'Generic Audio';
  }
  
  if (name.includes('monitor') || name.includes('display') || name.includes('screen')) {
    return 'Generic Display';
  }
  
  if (name.includes('tablet') || name.includes('ipad')) {
    return 'Generic Tablet';
  }
  
  if (name.includes('watch') || name.includes('smartwatch')) {
    return 'Generic Watch';
  }
  
  return 'Unknown';
}
