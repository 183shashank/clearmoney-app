const CATEGORY_RULES = [
  {
    name: 'Food Delivery',
    color: '#F97316',
    emoji: '🍕',
    keywords: ['swiggy', 'zomato', 'dunzo', 'blinkit', 'zepto', 'eatsure', 'freshmenu', 'faasos', 'box8'],
  },
  {
    name: 'Groceries',
    color: '#22C55E',
    emoji: '🛒',
    keywords: ['bigbasket', 'big basket', 'dmart', 'reliance fresh', 'more supermarket', 'jiomart',
      "nature's basket", 'grofers', 'supermart', 'bb daily', 'zepto grocery', 'blinkit grocery'],
  },
  {
    name: 'Transport',
    color: '#3B82F6',
    emoji: '🚗',
    keywords: ['ola', 'uber', 'rapido', 'yulu', 'blablacar', 'irctc', 'makemytrip', 'goibibo',
      'indigo', 'spicejet', 'redbus', 'metro card', 'best bus', 'meru', 'savaari'],
  },
  {
    name: 'Entertainment',
    color: '#A855F7',
    emoji: '🎬',
    keywords: ['netflix', 'spotify', 'amazon prime', 'hotstar', 'bookmyshow', 'pvr', 'inox',
      'zee5', 'sony liv', 'jiocinema', 'prime video', 'disney', 'apple tv', 'youtube premium',
      'mxplayer', 'voot'],
  },
  {
    name: 'Shopping',
    color: '#EC4899',
    emoji: '🛍️',
    keywords: ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'snapdeal', 'tata cliq',
      'limeroad', 'shopclues', 'pepperfry', 'urban ladder', 'ikea'],
  },
  {
    name: 'Utilities',
    color: '#6B7280',
    emoji: '💡',
    keywords: ['electricity', 'bescom', 'tata power', 'bses', 'mahanagar gas', 'jio', 'airtel',
      ' vi ', 'bsnl', 'water bill', 'gas bill', 'adani electric', 'torrent power',
      'msedcl', 'tneb', 'cesc', 'recharge', 'broadband'],
  },
  {
    name: 'Investment',
    color: '#10B981',
    emoji: '📈',
    keywords: ['zerodha', 'groww', 'kuvera', 'paytm money', 'coin by zerodha', 'sip',
      'mutual fund', ' mf ', 'nav', 'nsdl', 'smallcase', 'nippon', 'mirae', 'hdfc mf',
      'icici pru', 'axis mf', 'sbi mf', 'motilal', 'angel broking', 'upstox'],
  },
  {
    name: 'EMI / Loan',
    color: '#EF4444',
    emoji: '🏦',
    keywords: ['emi', 'loan repay', 'loan payment', 'bajaj finserv', 'hdfc loan', 'icici loan',
      'sbi loan', 'bnpl', 'simpl', 'lazypay', 'credit card', 'home loan', 'car loan',
      'personal loan', 'kotak loan'],
  },
  {
    name: 'Dining Out',
    color: '#F59E0B',
    emoji: '🍽️',
    keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'dominos', 'pizza',
      'biryani', 'chaayos', 'social', 'brewpub', 'dhaba', 'barista', 'costa coffee',
      'third wave', 'instacafe'],
  },
  {
    name: 'Health',
    color: '#14B8A6',
    emoji: '💊',
    keywords: ['pharmacy', 'apollo', 'medplus', 'netmeds', 'practo', 'hospital', 'clinic',
      'doctor', '1mg', 'pharmeasy', 'healthkart', 'cult fit', 'curefit'],
  },
  {
    name: 'Rent',
    color: '#8B5CF6',
    emoji: '🏠',
    keywords: ['rent', 'housing society', 'maintenance', 'pg payment', 'hostel fee', 'landlord'],
  },
];

const INCOME_KEYWORDS = ['salary', 'credit', 'neft cr', 'imps cr', 'credited', 'received',
  'refund', 'cashback', 'reward'];

export function categorizeTransaction(description, type) {
  const lower = (description || '').toLowerCase();

  if (type === 'credit') {
    if (INCOME_KEYWORDS.some(kw => lower.includes(kw))) return 'Income';
    return 'Income';
  }

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) {
      return rule.name;
    }
  }

  return 'Others';
}

export function getCategoryMeta(category) {
  const rule = CATEGORY_RULES.find(r => r.name === category);
  if (rule) return { color: rule.color, emoji: rule.emoji };

  const defaults = {
    Income: { color: '#10B981', emoji: '💰' },
    Others: { color: '#9CA3AF', emoji: '📋' },
  };
  return defaults[category] || { color: '#9CA3AF', emoji: '📋' };
}

export function isInvestment(description) {
  const lower = (description || '').toLowerCase();
  const rule = CATEGORY_RULES.find(r => r.name === 'Investment');
  return rule ? rule.keywords.some(kw => lower.includes(kw)) : false;
}

export function isEMI(description) {
  const lower = (description || '').toLowerCase();
  const rule = CATEGORY_RULES.find(r => r.name === 'EMI / Loan');
  return rule ? rule.keywords.some(kw => lower.includes(kw)) : false;
}

export { CATEGORY_RULES };
