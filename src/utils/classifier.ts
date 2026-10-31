import { Category } from '../types';

export const CATEGORIES: Category[] = [
  'Food',
  'Groceries',
  'Travel',
  'Utilities',
  'Entertainment',
  'Other',
];

// High-accuracy keyword lookup for instant, zero-latency classification
const KEYWORD_MAP: Record<Category, string[]> = {
  Food: [
    'pizza', 'burger', 'maggi', 'noodle', 'pasta', 'chai', 'tea', 'coffee', 'latte', 'cappuccino',
    'biryani', 'roti', 'naan', 'paneer', 'chicken', 'mutton', 'fish', 'dosa', 'idli', 'vada',
    'sandwich', 'roll', 'wrap', 'thali', 'rice', 'dal', 'curry', 'coke', 'pepsi', 'sprite',
    'beverage', 'drink', 'juice', 'shake', 'smoothie', 'snack', 'french fries', 'dessert',
    'cake', 'pastry', 'ice cream', 'momos', 'shawarma', 'tiffin', 'restaurant', 'cafe', 'canteen'
  ],
  Groceries: [
    'milk', 'curd', 'yogurt', 'egg', 'fruits', 'apple', 'banana', 'orange', 'mango', 'vegetables',
    'onion', 'potato', 'tomato', 'atta', 'flour', 'rice bag', 'oil', 'ghee', 'butter', 'cheese',
    'bread', 'biscuit', 'cookies', 'soap', 'shampoo', 'detergent', 'toothpaste', 'brush', 'spices',
    'masala', 'salt', 'sugar', 'supermarket', 'mart', 'kirana'
  ],
  Travel: [
    'uber', 'ola', 'rapido', 'auto', 'cab', 'taxi', 'rickshaw', 'train', 'irctc', 'metro',
    'bus', 'redbus', 'petrol', 'fuel', 'diesel', 'cng', 'flight', 'indigo', 'air india',
    'toll', 'fastag', 'parking'
  ],
  Utilities: [
    'wifi', 'wi-fi', 'broadband', 'airtel', 'jio', 'vi', 'recharge', 'electricity', 'power',
    'water', 'gas', 'cylinder', 'lpg', 'maid', 'cook', 'cleaner', 'rent', 'maintenance'
  ],
  Entertainment: [
    'movie', 'cinema', 'pvr', 'inox', 'netflix', 'spotify', 'prime', 'hotstar', 'game',
    'steam', 'playstation', 'bowling', 'arcade', 'concert', 'event', 'party', 'show', 'ticket'
  ],
  Other: []
};

/**
 * Fast client-side categorization engine.
 * Categorizes item names into one of the 6 predefined categories.
 */
export function classifyItem(itemName: string): Category {
  const text = itemName.toLowerCase();

  for (const [cat, keywords] of Object.entries(KEYWORD_MAP) as [Category, string[]][]) {
    for (const kw of keywords) {
      if (text.includes(kw)) {
        return cat;
      }
    }
  }

  return 'Food'; // default fallback for food/hostel bills
}

/**
 * Lazy-loaded Xenova/mobilebert-uncased-mnli zero-shot classifier state
 */
let zeroShotPipeline: any = null;
let isLoadingModel = false;

export async function initZeroShotClassifier(
  onProgress?: (progress: number, message: string) => void
): Promise<boolean> {
  if (zeroShotPipeline) return true;
  if (isLoadingModel) return false;

  try {
    isLoadingModel = true;
    // Dynamic import to satisfy lazy-loading requirement via CDN (never blocks initial render)
    const cdnUrl = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
    // @ts-ignore
    const { pipeline } = await import(/* @vite-ignore */ cdnUrl);
    
    onProgress?.(30, 'Downloading Xenova/mobilebert-uncased-mnli weights...');
    zeroShotPipeline = await pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli', {
      progress_callback: (p: any) => {
        if (p && p.progress) {
          onProgress?.(Math.round(p.progress * 100), `Downloading model: ${Math.round(p.progress * 100)}%`);
        }
      }
    });

    onProgress?.(100, 'Zero-shot model ready!');
    isLoadingModel = false;
    return true;
  } catch (err) {
    console.warn('Transformers.js lazy load unavailable in this environment, falling back to local heuristic classifier:', err);
    isLoadingModel = false;
    return false;
  }
}

/**
 * Perform zero-shot classification using Transformers.js if loaded, or fallback
 */
export async function classifyItemZeroShot(itemName: string): Promise<Category> {
  if (zeroShotPipeline) {
    try {
      const output = await zeroShotPipeline(itemName, CATEGORIES);
      if (output && output.labels && output.labels.length > 0) {
        return output.labels[0] as Category;
      }
    } catch (e) {
      console.error('Zero-shot prediction failed, using fallback:', e);
    }
  }
  return classifyItem(itemName);
}
