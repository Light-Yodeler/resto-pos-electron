const fs = require('fs');
const path = require('path');

const categories = [
  'European Corner',
  'Sandwich & Burger',
  'Indonesian Corner',
  'Sasak Traditional',
  'Seafood',
  'Soup',
  'Salad',
  'Vegetables',
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
  { name: 'Grilled Marinated Tenderloin Steak', en: 'Grilled Marinated Tenderloin Steak Creamy Mushroom Sauce', category: 'European Corner', price: 120000, icon: '🥩' },
  { name: 'Hot Plate Steak', en: 'Hot Plate Steak, Creamy Mushroom, Black Pepper Sauce', category: 'European Corner', price: 100000, icon: '🥩' },
  { name: 'Pan Fried Chicken Breast Garlic Butter', en: 'Pan Fried Chicken Breast with Garlic Butter Sauce, Vegetables & Lyonnaise Potatoes', category: 'European Corner', price: 75000, icon: '🍗' },
  { name: 'Grilled Lemon Herb Chicken', en: 'Grilled Lemon Herb Chicken', category: 'European Corner', price: 75000, icon: '🍗' },
  { name: 'Spaghetti Bolognese', en: 'Spaghetti Bolognese', category: 'European Corner', price: 60000, icon: '🍝' },
  { name: 'Shrimp Fettucine Alfredo', en: 'Shrimp Fettucine Alfredo', category: 'European Corner', price: 68000, icon: '🍝' },
  { name: 'Creamy Garlic Chicken Penne', en: 'Creamy Garlic Chicken Penne', category: 'European Corner', price: 64000, icon: '🍝' },
  { name: 'Margherita Pizza', en: 'Margherita Pizza', category: 'European Corner', price: 60000, icon: '🍕' },
  { name: 'Tuna Pizza', en: 'Tuna Pizza', category: 'European Corner', price: 73000, icon: '🍕' },
  { name: 'Oscaiola Pizza', en: 'Oscaiola Pizza', category: 'European Corner', price: 75000, icon: '🍕' },
  { name: 'Frutti Di Mare Pizza', en: 'Frutti Di Mare Pizza', category: 'European Corner', price: 75000, icon: '🍕' },

  // 2. Sandwich & Burger
  { name: 'King Club Sandwich', en: 'King Club Sandwich', category: 'Sandwich & Burger', price: 60000, icon: '🥪' },
  { name: 'Beef Burger', en: 'Beef Burger', category: 'Sandwich & Burger', price: 68000, icon: '🍔' },
  { name: 'Tuna Melt Sandwich', en: 'Tuna Melt Sandwich', category: 'Sandwich & Burger', price: 60000, icon: '🥪' },

  // 3. Indonesian Corner
  { name: 'Nasi / Mie Goreng Nusantara', en: 'Nasi / Mie Goreng Nusantara', category: 'Indonesian Corner', price: 50000, icon: '🍛' },
  { name: 'Mie Goreng Bahari', en: 'Mie Goreng Bahari (Seafood)', category: 'Indonesian Corner', price: 65000, icon: '🍜' },
  { name: 'Bebek Goreng Ungkep Rempah Sambal Ijo', en: 'Deep Fried Spiced Duck with Plain Rice, Lalapan & Sambal Ijo', category: 'Indonesian Corner', price: 85000, icon: '🍗' },
  { name: 'Sate Pincuk Mandalika', en: 'Sate Pincuk Mandalika (Chicken & Beef Skewer)', category: 'Indonesian Corner', price: 80000, icon: '🍢' },
  { name: 'Ikan Bakar Sambal Tomat', en: 'Grilled Marinated Fish Fillet with Steam Rice & Beberok', category: 'Indonesian Corner', price: 64000, icon: '🐟' },
  { name: 'Ayam Goreng Kuning Sambal Bawang', en: 'Deep Fried Yellow Chicken with Sambal Bawang', category: 'Indonesian Corner', price: 76000, icon: '🍗' },

  // 4. Sasak Traditional
  { name: 'Pelecing Kangkung', en: 'Pelecing Kangkung (Water Spinach & Bean Sprouts with Sambal Tomat)', category: 'Sasak Traditional', price: 30000, icon: '🥗' },
  { name: 'Rajang Soup Sari Laut', en: 'Rajang Soup Sari Laut (Sasak Seafood Soup)', category: 'Sasak Traditional', price: 65000, icon: '🍲' },
  { name: 'Nasi Goreng Sasak', en: 'Nasi Goreng Sasak (Spicy Sasak Fried Rice with Satay & Egg)', category: 'Sasak Traditional', price: 65000, icon: '🍛' },
  { name: 'Ayam Bakar / Goreng Beberok', en: 'Ayam Bakar / Goreng Beberok (Taliwang / Pelecing Sauce)', category: 'Sasak Traditional', price: 75000, icon: '🍗' },
  { name: 'Sate Rembiga', en: 'Sate Rembiga (Sweet & Spicy Marinated Beef Satay)', category: 'Sasak Traditional', price: 80000, icon: '🍢' },
  { name: 'Sasak Pesajik Sampler', en: 'Sasak Pesajik Sampler for Two (Rembiga, Pusut, Pelecingan, Fish, Kangkung & Rice)', category: 'Sasak Traditional', price: 165000, icon: '🍱' },
  { name: 'Bebalung Lombok', en: 'Bebalung Lombok (Traditional Sasak Beef Ribs Soup)', category: 'Sasak Traditional', price: 68000, icon: '🍲' },
  { name: 'Ayam Bakar Pejanggik', en: 'Ayam Bakar Pejanggik (Grilled Chicken with Spicy Pejanggik Sauce)', category: 'Sasak Traditional', price: 76000, icon: '🍗' },

  // 5. Seafood
  { name: 'Sweet Chili Honey Prawns', en: 'Sweet Chili Honey Prawns with Steam Rice & Vegetables', category: 'Seafood', price: 87000, icon: '🦐' },
  { name: 'Lombok Udang Bakar', en: 'Lombok Grilled Chili Spiced Prawns', category: 'Seafood', price: 85000, icon: '🦐' },
  { name: 'Sizzling Prawns', en: 'Sizzling Prawns with White Butter Sauce on Hot Plate', category: 'Seafood', price: 87000, icon: '🦐' },
  { name: 'Pan Fried Silver Trivally', en: 'Pan Fried Silver Trivally with Orange Butter Sauce & Potato Wedges', category: 'Seafood', price: 64000, icon: '🐟' },
  { name: 'Mahi - Mahi Bakar Laut Selatan', en: 'Grilled Mahi-Mahi with Sambal Dabu-Dabu', category: 'Seafood', price: 64000, icon: '🐟' },
  { name: 'Ikan Bakar / Goreng / Steam (100g)', en: 'Fresh Fish (Grill/Deep Fried/Steam per 100g with Sambal Selection)', category: 'Seafood', price: 28000, icon: '🐟' },
  { name: 'Grilled Tuna Steak Asian Sesame Crust', en: 'Grilled Tuna Steak with Asian Sesame Crust', category: 'Seafood', price: 64000, icon: '🐟' },
  { name: 'Cumi Bakar Segare Lauk', en: 'Cumi Bakar Segare Lauk (Sasak Grilled Squid with Rice & Kangkung)', category: 'Seafood', price: 85000, icon: '🦑' },
  { name: 'Kepiting / Crab (100g)', en: 'Fresh Crab (Black Pepper / Padang Sauce per 100g)', category: 'Seafood', price: 35000, icon: '🦀' },

  // 6. Soup
  { name: 'Cream Mushroom Soup Garlic Crouton', en: 'Cream Mushroom Soup with Garlic Crouton', category: 'Soup', price: 40000, icon: '🍲' },
  { name: 'Tom Yam Kung', en: 'Tom Yam Kung (Thai Hot & Sour Shrimp Soup)', category: 'Soup', price: 65000, icon: '🍲' },
  { name: 'Soto Kudus Ayam Kampung', en: 'Soto Kudus Ayam Kampung', category: 'Soup', price: 45000, icon: '🍲' },

  // 7. Salad
  { name: 'Spring Mix Salad', en: 'Spring Mix Salad with Ranch Dressing & Croutons', category: 'Salad', price: 28000, icon: '🥗' },
  { name: 'Nicoise Salad', en: 'Nicoise Salad with Grilled Tuna, Potatoes, Egg & Olives', category: 'Salad', price: 45000, icon: '🥗' },
  { name: 'Karedok', en: 'Karedok (Indonesian Fresh Vegetables with Peanut Sauce)', category: 'Salad', price: 30000, icon: '🥗' },

  // 8. Vegetables Alternative
  { name: 'Cah Kangkung', en: 'Stir Fry Green Water Spinach', category: 'Vegetables', price: 35000, icon: '🥬' },
  { name: 'Tumis Tahu Jamur', en: 'Stir Fry Tofu & Mushrooms', category: 'Vegetables', price: 36000, icon: '🍄' },
  { name: 'Urap Sayur', en: 'Urap Sayur (Boiled Mixed Vegetables with Grated Spiced Coconut)', category: 'Vegetables', price: 30000, icon: '🥗' },

  // 9. Light Snack
  { name: 'Lumpia Goreng', en: 'Indonesian Chicken Vegetable Spring Roll', category: 'Light Snack', price: 45000, icon: '🥟' },
  { name: 'Crispy Cajun Spice Calamari', en: 'Crispy Cajun Spice Calamari with Chili Mayo', category: 'Light Snack', price: 60000, icon: '🦑' },
  { name: 'Garlic Bread', en: 'Soft & Melted Cheese Garlic Bread', category: 'Light Snack', price: 30000, icon: '🥖' },
  { name: 'French Fries', en: 'Crispy French Fries', category: 'Light Snack', price: 32000, icon: '🍟' },

  // 10. Fresh Juice
  { name: 'Jus Semangka', en: 'Watermelon Fresh Juice', category: 'Fresh Juice', price: 25000, icon: '🍉' },
  { name: 'Jus Nanas', en: 'Pineapple Fresh Juice', category: 'Fresh Juice', price: 25000, icon: '🍍' },
  { name: 'Jus Lemon Pepaya', en: 'Lemon Papaya Fresh Juice', category: 'Fresh Juice', price: 25000, icon: '🍋' },
  { name: 'Jus Melon', en: 'Melon Fresh Juice', category: 'Fresh Juice', price: 25000, icon: '🍈' },
  { name: 'Jus Buah Campur', en: 'Mixed Fruit Fresh Juice', category: 'Fresh Juice', price: 25000, icon: '🍹' },

  // 11. Tea
  { name: 'Regular Black Tea', en: 'Regular Black Tea', category: 'Tea', price: 15000, icon: '🍵' },
  { name: 'Green Tea', en: 'Green Tea', category: 'Tea', price: 15000, icon: '🍵' },
  { name: 'Ginger Tea', en: 'Ginger Tea', category: 'Tea', price: 15000, icon: '🫖' },
  { name: 'Honey Ginger Lime Tea', en: 'Honey Ginger Lime Tea', category: 'Tea', price: 20000, icon: '🍯' },
  { name: 'Ice Milk Brown Sugar Tea', en: 'Ice Milk Brown Sugar Tea', category: 'Tea', price: 25000, icon: '🧋' },
  { name: 'Ice Lemon Tea', en: 'Ice Lemon Tea', category: 'Tea', price: 20000, icon: '🍋' },
  { name: 'Ice Lychee Tea', en: 'Ice Lychee Tea', category: 'Tea', price: 20000, icon: '🍹' },
  { name: 'Ice Peach Tea', en: 'Ice Peach Tea', category: 'Tea', price: 20000, icon: '🍑' },

  // 12. Coffee
  { name: 'Lombok Coffee', en: 'Lombok Coffee', category: 'Coffee', price: 15000, icon: '☕' },
  { name: 'Nescafe', en: 'Nescafe', category: 'Coffee', price: 15000, icon: '☕' },
  { name: 'Exotic Ice Lombok Coffee', en: 'Exotic Ice Lombok Coffee', category: 'Coffee', price: 30000, icon: '🧊' },
  { name: 'Ice Coffee Milk with Palm Sugar', en: 'Ice Coffee Milk with Palm Sugar', category: 'Coffee', price: 30000, icon: '🧋' },

  // 13. Soft Drink
  { name: 'Coca Cola', en: 'Coca Cola', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Sprite', en: 'Sprite', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Fanta', en: 'Fanta', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Ginger Ale', en: 'Ginger Ale', category: 'Soft Drink', price: 15000, icon: '🥤' },
  { name: 'Fresh Tea', en: 'Fresh Tea', category: 'Soft Drink', price: 15000, icon: '🧃' },
  { name: 'Air Mineral Besar (Large)', en: 'Mineral Water (Large bottle)', category: 'Soft Drink', price: 15000, icon: '💧' },
  { name: 'Air Mineral Kecil (Small)', en: 'Mineral Water (Small bottle)', category: 'Soft Drink', price: 10000, icon: '💧' },

  // 14. Mocktail
  { name: 'Cocos Mocktail', en: 'Cocos (Coconut Milk, Condensed Milk, Strawberry Syrup, Ice Cream)', category: 'Mocktail', price: 37000, icon: '🥥' },
  { name: 'Soda Gembira', en: 'Soda Gembira (Condensed Milk, Grenadine, Soda)', category: 'Mocktail', price: 35000, icon: '🍹' },
  { name: 'Strait Punch', en: 'Strait Punch (Pineapple, Orange, Lime, Grenadine, Soda)', category: 'Mocktail', price: 35000, icon: '🍹' },
  { name: 'Virgin Colada', en: 'Virgin Colada (Pineapple Juice, Coconut Milk, Lime Juice, Syrup)', category: 'Mocktail', price: 35000, icon: '🍍' },

  // 15. Milkshake
  { name: 'Coco Vanilla Milkshake', en: 'Coco Vanilla Milkshake (Coconut Milk, Brown Sugar, Vanilla Ice Cream)', category: 'Milkshake', price: 37000, icon: '🥤' },
  { name: 'Vanilla Milkshake', en: 'Vanilla Milkshake', category: 'Milkshake', price: 35000, icon: '🥤' },
  { name: 'Strawberry Milkshake', en: 'Strawberry Milkshake', category: 'Milkshake', price: 35000, icon: '🍓' },
  { name: 'Chocolate Milkshake', en: 'Chocolate Milkshake', category: 'Milkshake', price: 35000, icon: '🍫' },

  // 16. Dessert
  { name: 'Tropical Fruit Salad', en: 'Tropical Fruit Salad (Mixed Fresh Fruit with Yogurt & Ice Cream)', category: 'Dessert', price: 40000, icon: '🍨' },
  { name: 'Banana Split', en: 'Banana Split (Chocolate, Strawberry, Vanilla Ice Cream & Banana)', category: 'Dessert', price: 40000, icon: '🍌' },
  { name: 'Indonesian Pisang Goreng', en: 'Indonesian Pisang Goreng (Banana Fritters with Chocolate & Cheese)', category: 'Dessert', price: 30000, icon: '🍌' },
  { name: 'Cheesy Banana Spring Roll Chocolate', en: 'Cheesy Banana Spring Roll with Chocolate Sauce', category: 'Dessert', price: 35000, icon: '🥞' }
];

const products = menuItems.map((item, index) => ({
  id: index + 1,
  name: item.name,
  en: item.en,
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
