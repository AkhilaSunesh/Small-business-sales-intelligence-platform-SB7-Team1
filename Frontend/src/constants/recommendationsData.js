// Mock data for AI Recommendations (Milestone 2 Day 5)
// TODO: API INTEGRATION POINT - Replace with backend call: GET /api/v1/recommendations

export const mockRecommendations = [
  {
    id: 'REC-001',
    productPurchased: 'Coffee',
    recommendedProduct: 'Sugar',
    reason: 'Customers who bought Coffee also bought Sugar.',
    category: 'Frequently Bought Together',
    confidence: '94%',
  },
  {
    id: 'REC-002',
    productPurchased: 'Rice',
    recommendedProduct: 'Cooking Oil',
    reason: 'Customers who bought Rice also bought Cooking Oil.',
    category: 'Pantry Essential Pair',
    confidence: '88%',
  },
  {
    id: 'REC-003',
    productPurchased: 'Shampoo',
    recommendedProduct: 'Conditioner',
    reason: 'Customers who bought Shampoo also bought Conditioner.',
    category: 'Haircare Combo',
    confidence: '91%',
  },
  {
    id: 'REC-004',
    productPurchased: 'Wireless Mouse',
    recommendedProduct: 'Mouse Pad',
    reason: 'Customers who bought Wireless Mouse also bought Mouse Pad.',
    category: 'Accessory Bundle',
    confidence: '85%',
  },
  {
    id: 'REC-005',
    productPurchased: 'Organic Green Tea',
    recommendedProduct: 'Raw Honey',
    reason: 'Customers who bought Organic Green Tea also bought Raw Honey.',
    category: 'Wellness Complement',
    confidence: '82%',
  },
  {
    id: 'REC-006',
    productPurchased: 'Running Shoes',
    recommendedProduct: 'Sports Socks',
    reason: 'Customers who bought Running Shoes also bought Sports Socks.',
    category: 'Athletic Pair',
    confidence: '89%',
  },
];
