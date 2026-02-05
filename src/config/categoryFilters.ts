// src/config/categoryFilters.ts

export type CategoryKey =
  | 'Laptops'
  | 'Phones'
  | 'Phone Cases & Protection'
  | 'Monitors'
  | 'Headphones & Audio'
  | 'Keyboards & Mice'
  | 'TV & Display'
  | 'Tablets'
  | 'Smartwatches'
  | 'Home & Garden'
  | 'Personal Care'
  | 'Small Appliances'
  | 'Wellness & Supplements'
  | 'Gifts & Lifestyle'
  | 'Books & Media'
  | 'Toys & Games'
  | 'Kitchen';

export const CATEGORY_SYNONYMS: Record<CategoryKey, string[]> = {
  Laptops: [
    'laptop',
    'laptops',
    'notebook',
  ],
  Phones: [
    'phone',
    'phones',
    'smartphone',
    'smartphones',
    'telefon',
    'telefoane',
    'telefon mobil',
    'telefoane mobile',
    'mobil',
  ],
  'Phone Cases & Protection': [
    'phone case',
    'phone cases',
    'phone cover',
    'phone covers',
    'phone protection',
    'husa',
    'husă',
    'huse',
    'huse telefoane',
    'huse si folii',
    'case',
    'cover',
  ],
  Monitors: [
    'monitor',
    'monitoare',
    'display',
  ],
  'Headphones & Audio': [
    'headphone',
    'headphones',
    'headset',
    'earbuds',
    'earphones',
    'audio',
    'casti',
    'căști',
    'casti audio',
    'căști audio',
  ],
  'Keyboards & Mice': [
    'keyboard',
    'keyboards',
    'mouse',
    'mice',
    'tastatura',
    'tastaturi',
    'mouse-uri',
  ],
  'TV & Display': [
    'tv',
    'televizor',
    'televizoare',
    'display',
    'monitor tv',
  ],
  Tablets: [
    'tablet',
    'tablets',
    'tableta',
    'tablete',
    'ipad',
  ],
  Smartwatches: [
    'smartwatch',
    'smartwatches',
    'ceas inteligent',
    'ceas smart',
  ],
  'Home & Garden': [
    'home & garden',
    'home and garden',
    'casa si gradina',
    'casă și grădină',
    'casa & gradina',
  ],
  'Personal Care': [
    'personal care',
    'ingrijire personala',
    'îngrijire personală',
    'ingrijire',
  ],
  'Small Appliances': [
    'small appliances',
    'electrocasnice mici',
    'aparat',
    'aparat de bucatarie',
  ],
  'Wellness & Supplements': [
    'wellness',
    'supplement',
    'suplimente',
    'vitamine',
  ],
  'Gifts & Lifestyle': [
    'gifts',
    'gift',
    'cadouri',
    'lifestyle',
    'stil de viata',
  ],
  'Books & Media': [
    'books',
    'book',
    'carte',
    'carti',
    'media',
  ],
  'Toys & Games': [
    'toys',
    'jucarii',
    'jucării',
    'games',
    'jocuri',
  ],
  Kitchen: [
    'kitchen',
    'bucatarie',
    'bucătărie',
    'ustensile bucatarie',
  ],
};
