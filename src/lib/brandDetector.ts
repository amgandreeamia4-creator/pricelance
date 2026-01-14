/**
 * Brand detection utility for extracting manufacturer from product names
 */

const KNOWN_BRANDS = [
  'Apple',
  'Samsung', 
  'Xiaomi',
  'Huawei',
  'Google',
  'OnePlus',
  'Sony',
  'Asus',
  'Lenovo',
  'HP',
  'Dell',
  'Acer',
  'MSI',
  'Microsoft',
  'Realme',
  'Motorola',
  // Add more brands as needed
] as const;

type Brand = typeof KNOWN_BRANDS[number];

/**
 * Detects known brand from product name (case-insensitive)
 * @param name - Product name to analyze
 * @returns Detected brand or null if not found
 */
export function detectBrandFromName(name?: string | null): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }

  const normalizedName = name.toLowerCase().trim();
  
  // Check each brand against the product name
  for (const brand of KNOWN_BRANDS) {
    const brandLower = brand.toLowerCase();
    
    // Check if brand appears as a word or at start of name
    if (
      normalizedName.startsWith(brandLower) ||
      normalizedName.includes(` ${brandLower} `) ||
      normalizedName.includes(` ${brandLower}`) ||
      normalizedName.includes(`${brandLower} `)
    ) {
      return brand;
    }
  }

  return null;
}

/**
 * Get list of all known brands
 */
export function getKnownBrands(): readonly string[] {
  return KNOWN_BRANDS;
}
