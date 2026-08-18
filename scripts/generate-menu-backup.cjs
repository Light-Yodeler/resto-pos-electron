const fs = require('fs');
const path = require('path');

const categories = [
  'European Corner',
  'Sandwich',
  'Indonesian Corner',
  'Sasak Traditional',
  'Seafood',
  'Soup',
  'Salad',
  'Vegetables Alternative',
  'Light Snack',
  'Fresh Juice',
  'Tea',
  'Coffee',
  'Soft Drink',
  'Mocktail',
  'Milkshake',
  'Dessert'
];

const menuItems = [
  // 1. European Corner
  { name: 'Grilled Marinated Tenderloin Steak Creamy Mushroom Sauce', category: 'European Corner', price: 120000, icon: '🥩' },
  { name: 'Hot Plate Steak, Creamy Mushroom, Black Pepper Sauce', category: 'European Corner', price: 100000, icon: '🥩' },
  { name: 'Pan Fried Chicken Breast with Garlic Butter Sauce, Vegetables & Lyonnaise Potatoes', category: 'European Corner', price: 75000, icon: '🍗' },
  { name: 'Grilled Lemon Herb Chicken', category: 'European Corner', price: 75000, icon: '🍗' },
  { name: 'Spaghetti Bolognese', category: 'European Corner', price: 60000, icon: '🍝' },
  { name: 'Shrimp Fettucine Alfredo', category: 'European Corner', price: 68000, icon: '🍝' },
  { name: 'Creamy Garlic Chicken Penne', category: 'European Corner', price: 64000, icon: '🍝' },
  { name: 'Margherita Pizza', category: 'European Corner', price: 60000, icon: '🍕' },
  { name: 'Tuna Pizza', category: 'European Corner', price: 73000, icon: '🍕' },
  { name: 'Oscaiola Pizza', category: 'European Corner', price: 75000, icon: '🍕' },
  { name: 'Frutti Di Mare Pizza', category: 'European Corner', price: 75000, icon: '🍕' },

  // 2. Sandwich
  { name: 'King Club Sandwich', category: 'Sandwich', price: 60000, icon: '🥪' },
  { name: 'Beef Burger', category: 'Sandwich', price: 68000, icon: '🍔' },
  { name: 'Tuna Melt Sandwich', category: 'Sandwich', price: 60000, icon: '🥪' },

  // 3. Indonesian Corner
  { name: 'Nasi / Mie Goreng Nusantara', category: 'Indonesian Corner', price: 50000, icon: '🍛' },
  { name: 'Mie Goreng Bahari', category: 'Indonesian Corner', price: 65000, icon: '🍜' },
  { name: 'Bebek Goreng Ungkep Rempah Sambal Ijo', category: 'Indonesian Corner', price: 85000, icon: '🍗' },
  { name: 'Sate Pincuk Mandalika', category: 'Indonesian Corner', price: 80000, icon: '🍢' },
  { name: 'Ikan Bakar Sambal Tomat', category: 'Indonesian Corner', price: 64000, icon: '🐟' },
  { name: 'Ayam Goreng Kuning Sambal Bawang', category: 'Indonesian Corner', price: 76000, icon: '🍗' },

  // 4. Sasak Traditional
  { name: 'Pelecing Kangkung', category: 'Sasak Traditional', price: 30000, icon: '🥗' },
  { name: 'Rajang Soup Sari Laut', category: 'Sasak Traditional', price: 65000, icon: '🍲' },
  { name: 'Nasi Goreng Sasak', category: 'Sasak Traditional', price: 65000, icon: '🍛' },
  { name: 'Ayam Bakar / Goreng Beberok', category: 'Sasak Traditional', price: 75000, icon: '🍗' },
  { name: 'Sate Rembiga', category: 'Sasak Traditional', price: 80000, icon: '🍢' },
  { name: 'Sasak Pesajik Sampler', category: 'Sasak Traditional', price: 165000, icon: '🍱' },
  { name: 'Bebalung Lombok', category: 'Sasak Traditional', price: 68000, icon: '🍲' },
  { name: 'Ayam Bakar Pejanggik', category: 'Sasak Traditional', price: 76000, icon: '🍗' },

  // 5. Seafood
  { name: 'Sweet Chili Honey Prawns', category: 'Seafood', price: 87000, icon: '🦐' },
  { name: 'Lombok Udang Bakar', category: 'Seafood', price: 85000, icon: '🦐' },
  { name: 'Sizzling Prawns', category: 'Seafood', price: 87000, icon: '🦐' },
  { name: 'Pan Fried Silver Trivally', category: 'Seafood', price: 64000, icon: '🐟' },
  { name: 'Mahi - Mahi Bakar Laut Selatan', category: 'Seafood', price: 64000, icon: '🐟' },
  { name: 'Ikan Bakar / Goreng / Steam (price per 100 grams)', category: 'Seafood', price: 28000, icon: '🐟' },
  { name: 'Grilled Tuna Steak with Asian Sesame Crust', category: 'Seafood', price: 64000, icon: '🐟' },
  { name: 'Cumi Bakar Segare Lauk', category: 'Seafood', price: 85000, icon: '🦑' },
  { name: 'Kepiting / Crab (price per 100 grams)', category: 'Seafood', price: 35000, icon: '🦀' },

  // 6. Soup
  { name: 'Cream Mushroom Soup with Garlic Crouton', category: 'Soup', price: 40000, icon: '🍲' },
  { name: 'Tom Yam Kung', category: 'Soup', price: 65000, icon: '🍲' },
  { name: 'Soto Kudus Ayam Kampung', category: 'Soup', price: 45000, icon: '🍲' },

  // 7. Salad
  { name: 'Spring Mix Salad', category: 'Salad', price: 28000, icon: '🥗' },
  { name: 'Nicoise Salad', category: 'Salad', price: 45000, icon: '🥗' },
  { name: 'Karedok', category: 'Salad', price: 30000, icon: '🥗' },

  // 8. Vegetables Alternative
  { name: 'Cah Kangkung', category: 'Vegetables Alternative', price: 35000, icon: '🥬' },
  { name: 'Tumis Tahu Jamur', category: 'Vegetables Alternative', price: 36000, icon: '🍄' },
  { name: 'Urap Sayur', category: 'Vegetables Alternative', price: 30000, icon: '🥗' },

  // 9. Light Snack
  { name: 'Lumpia Goreng', category: 'Light Snack', price: 45000, icon: '🥟' },
  { name: 'Crispy Cajun Spice Calamari', category: 'Light Snack', price: 60000, icon: '🦑' },
  { name: 'Garlic Bread', category: 'Light Snack', price: 30000, icon: '🥖' },
  { name: 'French Fries', category: 'Light Snack', price: 32000, icon: '🍟' },

  // 10. Fresh Juice
  { name: 'Water Melon Juice', category: 'Fresh Juice', price: 25000, icon: '🍉' },
  { name: 'Pineapple Juice', category: 'Fresh Juice', price: 25000, icon: '🍍' },
  { name: 'Lemon Papaya Juice', category: 'Fresh Juice', price: 25000, icon: '🍋' },
  { name: 'Melon Juice', category: 'Fresh Juice', price: 25000, icon: '🍈' },
  { name: 'Mixed Fruit Juice', category: 'Fresh Juice', price: 25000, icon: '🍹' },

  // 11. Tea
  { name: 'Regular Black Tea', category: 'Tea', price: 15000, icon: '🍵' },
  { name: 'Green Tea', category: 'Tea', price: 15000, icon: '🍵' },
  { name: 'Ginger Tea', category: 'Tea', price: 15000, icon: '🫖' },
  { name: 'Honey Ginger Lime Tea', category: 'Tea', price: 20000, icon: '🍯' },
  { name: 'Ice Milk Brown Sugar Tea', category: 'Tea', price: 25000, icon: '🧋' },
  { name: 'Ice Lemon Tea', category: 'Tea', price: 20000, icon: '🍋' },
  { name: 'Ice Lychee Tea', category: 'Tea', price: 20000, icon: '🍹' },
  { name: 'Ice Peach Tea', category: 'Tea', price: 20000, icon: '🍑' },

  // 12. Coffee
  { name: 'Lombok Coffee', category: 'Coffee', price: 15000, icon: '☕' },
  { name: 'Nescafe', category: 'Coffee', price: 15000, icon: '☕' },
  { name: 'Exotic Ice Lombok Coffee', category: 'Coffee', price: 30000, icon: '🧊' },
  { name: 'Ice Coffee Milk with Palm Sugar', category: 'Coffee', price: 30000, icon: '🧋' },

  // 13. Soft Drink
  { name: 'Cola', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Sprite', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Fanta', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Ginger Ale', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Fresh Tea', category: 'Soft Drink', price: 15000, icon: '🧃' },
  { name: 'Mineral Water (Large bottle)', category: 'Soft Drink', price: 15000, icon: '💧' },
  { name: 'Mineral Water (Small bottle)', category: 'Soft Drink', price: 10000, icon: '💧' },

  // 14. Mocktail
  { name: 'Cocos', category: 'Mocktail', price: 37000, icon: '🥥' },
  { name: 'Soda Gembira', category: 'Mocktail', price: 35000, icon: '🍹' },
  { name: 'Strait Punch', category: 'Mocktail', price: 35000, icon: '🍹' },
  { name: 'Virgin Colada', category: 'Mocktail', price: 35000, icon: '🍍' },

  // 15. Milkshake
  { name: 'Coco Vanilla Milkshake', category: 'Milkshake', price: 37000, icon: '🥤' },
  { name: 'Vanilla Milkshake', category: 'Milkshake', price: 35000, icon: '🥤' },
  { name: 'Strawberry Milkshake', category: 'Milkshake', price: 35000, icon: '🍓' },
  { name: 'Chocolate Milkshake', category: 'Milkshake', price: 35000, icon: '🍫' },

  // 16. Dessert
  { name: 'Tropical Fruit Salad', category: 'Dessert', price: 40000, icon: '🍨' },
  { name: 'Banana Split', category: 'Dessert', price: 40000, icon: '🍌' },
  { name: 'Indonesian Pisang Goreng', category: 'Dessert', price: 30000, icon: '🍌' },
  { name: 'Cheesy Banana Spring Roll with Chocolate Sauce', category: 'Dessert', price: 35000, icon: '🥞' }
];

const products = menuItems.map((item, index) => ({
  id: index + 1,
  name: item.name,
  en: item.name, // Same as name, without descriptions
  category: item.category,
  price: item.price,
  stock: 100,
  unlimitedStock: true,
  taxable: true,
  icon: item.icon,
  active: true
}));

const payload = {
  format: 'anda-pos-menu',
  version: 1,
  exportedAt: new Date().toISOString(),
  restaurantName: 'Anda Bungalows & Restaurant',
  categories: categories,
  products: products
};

const outputPath = path.join(__dirname, '..', 'anda-pos-menu.andamenu');
fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8');

// Also save to outputs/ directory
const outputsDir = path.join(__dirname, '..', 'outputs');
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
fs.writeFileSync(path.join(outputsDir, 'anda-pos-menu.andamenu'), JSON.stringify(payload, null, 2), 'utf8');

console.log(`Successfully generated anda-pos-menu.andamenu with ${categories.length} categories and ${products.length} products!`);
console.log('File saved to: ' + outputPath);
