export const CATEGORY_RULES = [
  // ── Transport (granular) ──────────────────────────────────────────────────
  {
    name: 'Cab',
    color: '#F97316',
    emoji: '🚕',
    group: 'Transport',
    keywords: ['ola', 'uber', 'rapido', 'meru cab', 'savaari', 'olacabs'],
  },
  {
    name: 'Commute',
    color: '#2563EB',
    emoji: '🚇',
    group: 'Transport',
    keywords: ['metro', 'best bus', 'bmtc', 'dmrc', 'nmmt', 'apsrtc', 'msrtc', 'local train',
      'rickshaw', 'auto fare', 'yulu', 'blablacar'],
  },
  {
    name: 'Fuel & Petrol',
    color: '#DC2626',
    emoji: '⛽',
    group: 'Transport',
    keywords: ['hpcl', 'iocl', 'indian oil', 'bharat petroleum', 'bpcl', 'shell petrol',
      'cng station', 'petrol pump', 'fuel station', 'essar oil', 'nayara'],
  },
  {
    name: 'Flight & Travel',
    color: '#7C3AED',
    emoji: '✈️',
    group: 'Transport',
    keywords: ['indigo', 'spicejet', 'air india', 'vistara', 'akasa', 'irctc', 'makemytrip',
      'goibibo', 'redbus', 'yatra', 'cleartrip', 'via.com', 'railway'],
  },

  // ── Food (granular) ───────────────────────────────────────────────────────
  {
    name: 'Food Delivery',
    color: '#EA580C',
    emoji: '🍕',
    group: 'Food',
    keywords: ['swiggy', 'zomato', 'dunzo', 'eatsure', 'freshmenu', 'faasos', 'box8'],
  },
  {
    name: 'Groceries',
    color: '#16A34A',
    emoji: '🛒',
    group: 'Food',
    keywords: ['bigbasket', 'big basket', 'dmart', 'reliance fresh', 'jiomart',
      "nature's basket", 'grofers', 'supermart', 'zepto', 'blinkit', 'bb daily',
      'more supermarket', 'star bazaar', 'hypermarket'],
  },
  {
    name: 'Dining Out',
    color: '#D97706',
    emoji: '🍽️',
    group: 'Food',
    keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'mcdonald',
      'kfc', 'dominos', 'pizza hut', 'biryani', 'chaayos', 'social bar', 'brewpub',
      'dhaba', 'barista', 'costa coffee', 'third wave', 'haldirams', 'barbeque nation',
      'burger king', 'subway'],
  },

  // ── Housing ───────────────────────────────────────────────────────────────
  {
    name: 'Rent',
    color: '#7C3AED',
    emoji: '🏠',
    group: 'Housing',
    keywords: ['rent', 'housing society', 'society maintenance', 'maintenance fee',
      'pg payment', 'hostel fee', 'landlord', 'owner transfer', 'flat rent'],
  },

  // ── Finance ───────────────────────────────────────────────────────────────
  {
    name: 'EMI & Loans',
    color: '#DC2626',
    emoji: '🏦',
    group: 'Finance',
    keywords: ['emi', 'loan repay', 'loan payment', 'bajaj finserv', 'hdfc loan',
      'icici loan', 'sbi loan', 'bnpl', 'simpl', 'lazypay', 'home loan', 'car loan',
      'personal loan', 'kotak loan', 'axis loan', 'credit card due'],
  },
  {
    name: 'Investment',
    color: '#059669',
    emoji: '📈',
    group: 'Finance',
    keywords: ['zerodha', 'groww', 'kuvera', 'paytm money', 'coin by zerodha', 'sip',
      'mutual fund', ' mf ', 'nav', 'nsdl', 'smallcase', 'nippon', 'mirae', 'hdfc mf',
      'icici pru', 'axis mf', 'sbi mf', 'motilal', 'angel broking', 'upstox'],
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  {
    name: 'Utilities',
    color: '#6B7280',
    emoji: '💡',
    group: 'Utilities',
    keywords: ['electricity', 'bescom', 'tata power', 'bses', 'mahanagar gas', 'jio',
      'airtel', ' vi ', 'bsnl', 'water bill', 'gas bill', 'adani electric', 'torrent power',
      'msedcl', 'tneb', 'cesc', 'recharge', 'broadband', 'postpaid'],
  },

  // ── Lifestyle ─────────────────────────────────────────────────────────────
  {
    name: 'Entertainment',
    color: '#9333EA',
    emoji: '🎬',
    group: 'Lifestyle',
    keywords: ['netflix', 'spotify', 'amazon prime', 'hotstar', 'bookmyshow', 'pvr', 'inox',
      'zee5', 'sony liv', 'jiocinema', 'prime video', 'disney', 'apple tv',
      'youtube premium', 'mxplayer', 'voot'],
  },
  {
    name: 'Shopping',
    color: '#EC4899',
    emoji: '🛍️',
    group: 'Lifestyle',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'snapdeal',
      'tata cliq', 'limeroad', 'pepperfry', 'urban ladder', 'ikea', 'h&m', 'zara'],
  },
  {
    name: 'Health',
    color: '#0D9488',
    emoji: '💊',
    group: 'Lifestyle',
    keywords: ['pharmacy', 'apollo pharmacy', 'medplus', 'netmeds', 'practo', 'hospital',
      'clinic', 'doctor', '1mg', 'pharmeasy', 'healthkart', 'cult fit', 'curefit',
      'thyrocare', 'lal path'],
  },
];

const INCOME_KEYWORDS = ['salary', 'credit', 'neft cr', 'imps cr', 'credited', 'received',
  'refund', 'cashback', 'reward', 'by neft', 'by transfer', 'by imps', 'by clearing'];

export function categorizeTransaction(description, type) {
  if (type === 'credit') return 'Income';

  const lower = (description || '').toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.name;
    }
  }

  return 'Others';
}

export function getCategoryMeta(category) {
  const rule = CATEGORY_RULES.find(r => r.name === category);
  if (rule) return { color: rule.color, emoji: rule.emoji, group: rule.group };

  const special = {
    Income:  { color: '#10B981', emoji: '💰', group: 'Income' },
    Others:  { color: '#9CA3AF', emoji: '📋', group: 'Others' },
  };
  return special[category] || { color: '#9CA3AF', emoji: '📋', group: 'Others' };
}

export function getCategoryGroup(category) {
  return getCategoryMeta(category).group || 'Others';
}

// All unique debit categories for filter pills
export const DEBIT_CATEGORIES = [
  ...CATEGORY_RULES.map(r => r.name),
  'Others',
];

