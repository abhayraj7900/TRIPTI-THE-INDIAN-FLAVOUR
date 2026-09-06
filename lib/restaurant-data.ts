export type MenuItem = {
  id: number;
  name: string;
  note: string;
  price: number;
  category: string;
  veg: boolean;
  photo: number;
  badge?: string;
};

export const menu: MenuItem[] = [
  { id: 1, name: 'Garlic Chicken Rice Bowl', note: 'Garlic chicken over steamed rice', price: 149, category: 'Rice & Paratha', veg: false, photo: 1, badge: 'Popular' },
  { id: 2, name: 'Butter Chicken Rice Bowl', note: 'Creamy tomato chicken with rice', price: 159, category: 'Rice & Paratha', veg: false, photo: 1 },
  { id: 3, name: 'Pepper Chicken Rice Bowl', note: 'Peppery chicken and fragrant rice', price: 169, category: 'Rice & Paratha', veg: false, photo: 1 },
  { id: 4, name: 'Chicken 65 Rice Bowl', note: 'Spiced chicken 65 with rice', price: 169, category: 'Rice & Paratha', veg: false, photo: 1 },
  { id: 5, name: 'Aloo Paratha', note: 'Potato-stuffed tawa paratha', price: 99, category: 'Rice & Paratha', veg: true, photo: 0 },
  { id: 6, name: 'Mix Veg Paratha', note: 'Seasonal vegetable filling', price: 109, category: 'Rice & Paratha', veg: true, photo: 0 },
  { id: 7, name: 'Paneer Paratha', note: 'Cottage cheese-stuffed paratha', price: 129, category: 'Rice & Paratha', veg: true, photo: 0 },
  { id: 8, name: 'Amritsari Kulcha with Choley', note: 'Stuffed kulcha and spicy chickpeas', price: 139, category: 'Rice & Paratha', veg: true, photo: 0, badge: 'Must try' },
  { id: 9, name: 'Chicken Keema Paratha', note: 'Minced chicken in a crisp paratha', price: 169, category: 'Rice & Paratha', veg: false, photo: 0 },
  { id: 10, name: 'Paratha & Chai Combo', note: 'Stuffed paratha served with chai', price: 179, category: 'Rice & Paratha', veg: true, photo: 0 },

  { id: 11, name: 'Plain Chai', note: 'Freshly brewed Indian tea', price: 20, category: 'Tea & Maggi', veg: true, photo: 2 },
  { id: 12, name: 'Masala Chai', note: 'Tea brewed with warming spices', price: 20, category: 'Tea & Maggi', veg: true, photo: 2, badge: 'Classic' },
  { id: 13, name: 'Filter Coffee', note: 'South Indian-style coffee', price: 45, category: 'Tea & Maggi', veg: true, photo: 15 },
  { id: 14, name: 'Green Tea', note: 'A light, clean brew', price: 45, category: 'Tea & Maggi', veg: true, photo: 2 },
  { id: 15, name: 'Lemon Honey Tea', note: 'Lemon tea sweetened with honey', price: 65, category: 'Tea & Maggi', veg: true, photo: 2 },
  { id: 16, name: 'Iced Tea', note: 'Choose peach or lemon', price: 90, category: 'Tea & Maggi', veg: true, photo: 14 },
  { id: 17, name: 'Masala Maggi', note: 'Street-style masala noodles', price: 70, category: 'Tea & Maggi', veg: true, photo: 3 },
  { id: 18, name: 'Cheese Maggi', note: 'Masala noodles finished with cheese', price: 90, category: 'Tea & Maggi', veg: true, photo: 3 },

  { id: 19, name: 'Veg Momos — Steamed', note: 'Steamed dumplings with spicy chutney', price: 99, category: 'Momos', veg: true, photo: 4 },
  { id: 20, name: 'Veg Momos — Fried', note: 'Crisp-fried vegetable dumplings', price: 109, category: 'Momos', veg: true, photo: 4 },
  { id: 21, name: 'Paneer Momos — Steamed', note: 'Soft dumplings with paneer filling', price: 109, category: 'Momos', veg: true, photo: 4 },
  { id: 22, name: 'Paneer Momos — Fried', note: 'Crisp paneer-filled dumplings', price: 119, category: 'Momos', veg: true, photo: 4 },
  { id: 23, name: 'Soya Kernel Momos — Steamed', note: 'Protein-rich soya dumplings', price: 109, category: 'Momos', veg: true, photo: 4 },
  { id: 24, name: 'Soya Kernel Momos — Fried', note: 'Crispy soya-filled dumplings', price: 119, category: 'Momos', veg: true, photo: 4 },
  { id: 25, name: 'Chicken Momos — Steamed', note: 'Juicy chicken dumplings', price: 119, category: 'Momos', veg: false, photo: 4, badge: 'Popular' },
  { id: 26, name: 'Chicken Momos — Fried', note: 'Crisp chicken dumplings', price: 129, category: 'Momos', veg: false, photo: 4 },

  { id: 27, name: 'Honey Chilli Potato', note: 'Crispy potato in a sweet-spicy glaze', price: 129, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 28, name: 'Sweet Potato Fries', note: 'Crisp sweet potato fries', price: 99, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 29, name: 'French Fries', note: 'Golden, salted fries', price: 99, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 30, name: 'Veg Spring Rolls', note: 'Crisp rolls with vegetable filling', price: 139, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 31, name: 'Chilli Potato', note: 'Potatoes tossed with peppers and chilli', price: 139, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 32, name: 'Chilli Paneer', note: 'Paneer, peppers and chilli sauce', price: 149, category: 'Indo-Chinese', veg: true, photo: 5, badge: 'Bestseller' },
  { id: 33, name: 'Veg Chowmein', note: 'Wok-tossed noodles and vegetables', price: 149, category: 'Indo-Chinese', veg: true, photo: 6 },
  { id: 34, name: 'Paneer 65', note: 'Crispy spiced paneer bites', price: 149, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 35, name: 'Paneer Pakoda', note: 'Crisp gram-flour paneer fritters', price: 149, category: 'Indo-Chinese', veg: true, photo: 5 },
  { id: 36, name: 'Chicken Spring Rolls', note: 'Crispy chicken-filled rolls', price: 155, category: 'Indo-Chinese', veg: false, photo: 7 },
  { id: 37, name: 'Chilli Chicken', note: 'Chicken tossed with chilli and peppers', price: 169, category: 'Indo-Chinese', veg: false, photo: 7 },
  { id: 38, name: 'Chicken 65', note: 'South Indian-style spiced chicken', price: 179, category: 'Indo-Chinese', veg: false, photo: 7 },
  { id: 39, name: 'Dragon Chicken', note: 'Fiery wok-tossed chicken', price: 189, category: 'Indo-Chinese', veg: false, photo: 7 },
  { id: 40, name: 'Chicken Lollipop', note: 'Crispy chicken drumettes', price: 199, category: 'Indo-Chinese', veg: false, photo: 7 },
  { id: 41, name: 'Veg Schezwan Fried Rice', note: 'Spicy Schezwan vegetable rice', price: 139, category: 'Indo-Chinese', veg: true, photo: 8 },
  { id: 42, name: 'Egg Schezwan Fried Rice', note: 'Schezwan rice tossed with egg', price: 159, category: 'Indo-Chinese', veg: false, photo: 8 },
  { id: 43, name: 'Chicken Schezwan Fried Rice', note: 'Spicy chicken fried rice', price: 189, category: 'Indo-Chinese', veg: false, photo: 8 },
  { id: 44, name: 'Veg Garlic Fried Rice', note: 'Garlic rice with vegetables', price: 139, category: 'Indo-Chinese', veg: true, photo: 8 },
  { id: 45, name: 'Egg Garlic Fried Rice', note: 'Garlic fried rice with egg', price: 159, category: 'Indo-Chinese', veg: false, photo: 8 },
  { id: 46, name: 'Chicken Garlic Fried Rice', note: 'Garlic fried rice with chicken', price: 189, category: 'Indo-Chinese', veg: false, photo: 8 },
  { id: 47, name: 'Chicken Chowmein', note: 'Wok-tossed noodles with chicken', price: 189, category: 'Indo-Chinese', veg: false, photo: 6 },

  { id: 48, name: 'Thatte Idli Plain', note: 'Large, soft Karnataka-style idli', price: 139, category: 'South Indian', veg: true, photo: 9 },
  { id: 49, name: 'Thatte Idli with Ghee', note: 'Thatte idli finished with ghee', price: 149, category: 'South Indian', veg: true, photo: 9 },
  { id: 50, name: 'Benne Thatte Idli', note: 'Buttery Karnataka-style idli', price: 149, category: 'South Indian', veg: true, photo: 9 },
  { id: 51, name: 'Thatte Idli with Ghee Podi', note: 'Ghee and spiced podi', price: 159, category: 'South Indian', veg: true, photo: 9, badge: 'Must try' },
  { id: 52, name: 'Mini Idli with Sambar', note: 'Bite-size idli in warm sambar', price: 159, category: 'South Indian', veg: true, photo: 9 },
  { id: 53, name: 'Mini Idli with Ghee Podi', note: 'Mini idli tossed in ghee podi', price: 159, category: 'South Indian', veg: true, photo: 9 },
  { id: 54, name: 'Idli Vada Combo', note: 'One idli, one vada and chutneys', price: 169, category: 'South Indian', veg: true, photo: 9 },
  { id: 55, name: 'Idli Bhaji', note: 'Soft idli served with spiced bhaji', price: 179, category: 'South Indian', veg: true, photo: 9 },
  { id: 56, name: 'Ghee Roast Dosa', note: 'Thin dosa roasted in ghee', price: 159, category: 'South Indian', veg: true, photo: 10 },
  { id: 57, name: 'Set Dosa — 2 Pieces', note: 'Two soft dosas with sambar', price: 169, category: 'South Indian', veg: true, photo: 10 },
  { id: 58, name: 'Ghee Podi Dosa', note: 'Ghee dosa dusted with podi', price: 169, category: 'South Indian', veg: true, photo: 10 },
  { id: 59, name: 'Benne Masala Dosa', note: 'Butter-roasted masala dosa', price: 179, category: 'South Indian', veg: true, photo: 10, badge: 'Popular' },
  { id: 60, name: 'Ghee Podi Masala Dosa', note: 'Masala dosa with ghee podi', price: 179, category: 'South Indian', veg: true, photo: 10 },
  { id: 61, name: 'Mysore Masala Dosa', note: 'Spicy Mysore chutney and potato', price: 179, category: 'South Indian', veg: true, photo: 10 },
  { id: 62, name: 'Open Butter Masala Dosa', note: 'Open dosa with butter and masala', price: 189, category: 'South Indian', veg: true, photo: 10 },
  { id: 63, name: 'Open Butter Masala with Podi', note: 'Open butter dosa with spiced podi', price: 199, category: 'South Indian', veg: true, photo: 10 },
  { id: 64, name: 'Plain Uthappam', note: 'Soft, thick South Indian pancake', price: 139, category: 'South Indian', veg: true, photo: 11 },
  { id: 65, name: 'Onion Uthappam', note: 'Uthappam topped with onion', price: 149, category: 'South Indian', veg: true, photo: 11 },
  { id: 66, name: 'Mix Uthappam', note: 'Vegetable-topped uthappam', price: 149, category: 'South Indian', veg: true, photo: 11 },
  { id: 67, name: 'Cheese Uthappam', note: 'Uthappam finished with cheese', price: 149, category: 'South Indian', veg: true, photo: 11 },
  { id: 68, name: 'Podi Uthappam', note: 'Uthappam with spiced podi', price: 149, category: 'South Indian', veg: true, photo: 11 },
  { id: 69, name: 'Uddin Vada — 2 Pieces', note: 'Crisp lentil vadas with chutney', price: 139, category: 'South Indian', veg: true, photo: 12 },
  { id: 70, name: 'Uddin Vada with Sambar', note: 'Lentil vada served with sambar', price: 149, category: 'South Indian', veg: true, photo: 12 },
  { id: 71, name: 'South Indian Thali', note: 'Rice, sambar, rasam, vegetables and curd', price: 249, category: 'South Indian', veg: true, photo: 13, badge: 'Complete meal' },

  { id: 72, name: 'Shikanji', note: 'Classic salted-sweet lemon cooler', price: 69, category: 'Drinks', veg: true, photo: 14 },
  { id: 73, name: 'Masala Lemonade', note: 'Lemonade with Indian spices', price: 69, category: 'Drinks', veg: true, photo: 14 },
  { id: 74, name: 'Buttermilk', note: 'Chilled, lightly spiced chaas', price: 69, category: 'Drinks', veg: true, photo: 14 },
  { id: 75, name: 'Orange Juice', note: 'Fresh orange juice', price: 99, category: 'Drinks', veg: true, photo: 14 },
  { id: 76, name: 'Sweet Lime Juice', note: 'Fresh mausambi juice', price: 99, category: 'Drinks', veg: true, photo: 14 },
  { id: 77, name: 'Pineapple Juice', note: 'Fresh pineapple juice', price: 99, category: 'Drinks', veg: true, photo: 14 },
  { id: 78, name: 'Watermelon Juice', note: 'Fresh watermelon juice', price: 99, category: 'Drinks', veg: true, photo: 14 },
  { id: 79, name: 'Ice Apple Black Coconut', note: 'Tender ice apple and coconut cooler', price: 199, category: 'Drinks', veg: true, photo: 14 },
  { id: 80, name: 'Aam Panna', note: 'Raw mango summer cooler', price: 69, category: 'Drinks', veg: true, photo: 14 },
  { id: 81, name: 'Cold Coffee', note: 'Chilled creamy coffee', price: 129, category: 'Drinks', veg: true, photo: 15, badge: 'Popular' },
  { id: 82, name: 'Banana Shake', note: 'Creamy banana milkshake', price: 129, category: 'Drinks', veg: true, photo: 16 },
  { id: 83, name: 'Chiku Shake', note: 'Creamy sapota milkshake', price: 129, category: 'Drinks', veg: true, photo: 16 },
  { id: 84, name: 'Apple Shake', note: 'Fresh apple milkshake', price: 129, category: 'Drinks', veg: true, photo: 16 },
  { id: 85, name: 'Mango Lassi', note: 'Mango and yoghurt cooler', price: 129, category: 'Drinks', veg: true, photo: 16 },
  { id: 86, name: 'Chocolate Shake', note: 'Rich chocolate milkshake', price: 129, category: 'Drinks', veg: true, photo: 16 },
  { id: 87, name: 'Strawberry Shake', note: 'Creamy strawberry milkshake', price: 169, category: 'Drinks', veg: true, photo: 16 },
  { id: 88, name: 'Oreo Shake', note: 'Cookies-and-cream milkshake', price: 129, category: 'Drinks', veg: true, photo: 16 },
  { id: 89, name: 'Mixed Fruit Shake', note: 'Seasonal mixed fruit shake', price: 169, category: 'Drinks', veg: true, photo: 16 },
  { id: 90, name: 'Brownie Shake', note: 'Chocolate brownie milkshake', price: 199, category: 'Drinks', veg: true, photo: 16 },
  { id: 91, name: 'Dry Fruit Shake', note: 'Milkshake blended with dry fruits', price: 199, category: 'Drinks', veg: true, photo: 16 },
  { id: 92, name: 'Protein Shake', note: 'Creamy high-protein shake', price: 199, category: 'Drinks', veg: true, photo: 16 },
  { id: 93, name: 'ABC Cold-Pressed Juice', note: 'Apple, beetroot and carrot', price: 129, category: 'Drinks', veg: true, photo: 14 },
  { id: 94, name: 'Green Cold-Pressed Juice', note: 'Apple, cucumber and spinach', price: 129, category: 'Drinks', veg: true, photo: 14 },
  { id: 95, name: 'Anarbooze', note: 'Pineapple, watermelon and mint', price: 129, category: 'Drinks', veg: true, photo: 14 },
  { id: 96, name: 'OPM Cold-Pressed Juice', note: 'Orange, pineapple and mint', price: 129, category: 'Drinks', veg: true, photo: 14 },

  { id: 97, name: 'Pani Puri — 5 Pieces', note: 'Crisp puris with tangy mint water', price: 79, category: 'Chaat', veg: true, photo: 17, badge: 'Street favourite' },
  { id: 98, name: 'Bhel Puri', note: 'Puffed rice, chutneys and sev', price: 99, category: 'Chaat', veg: true, photo: 17 },
  { id: 99, name: 'Dahi Puri', note: 'Puris, yoghurt and chutneys', price: 109, category: 'Chaat', veg: true, photo: 17 },
  { id: 100, name: 'Dahi Bhalla', note: 'Soft lentil dumplings and yoghurt', price: 129, category: 'Chaat', veg: true, photo: 17 },
  { id: 101, name: 'Papdi Chaat', note: 'Crisp papdi with yoghurt and chutneys', price: 129, category: 'Chaat', veg: true, photo: 17 },
  { id: 102, name: 'Raj Kachori', note: 'Large crisp kachori loaded with chaat', price: 149, category: 'Chaat', veg: true, photo: 17 },
  { id: 103, name: 'Samosa — 2 Pieces', note: 'Classic crisp potato samosas', price: 49, category: 'Chaat', veg: true, photo: 17 },
  { id: 104, name: 'Samosa Chaat', note: 'Samosa, chickpeas, yoghurt and chutneys', price: 89, category: 'Chaat', veg: true, photo: 17 },
  { id: 105, name: 'Spicy Aloo Patties', note: 'Crisp potato patties with chutney', price: 119, category: 'Chaat', veg: true, photo: 17 },
  { id: 106, name: 'Chole Bhature', note: 'Fluffy bhature with spicy chickpeas', price: 149, category: 'Chaat', veg: true, photo: 18, badge: 'Signature' },

  { id: 107, name: 'Plain Pav Bhaji', note: 'Mumbai-style vegetable bhaji and pav', price: 99, category: 'Pav & Wraps', veg: true, photo: 21 },
  { id: 108, name: 'Butter Pav Bhaji', note: 'Buttery pav with rich vegetable bhaji', price: 129, category: 'Pav & Wraps', veg: true, photo: 21, badge: 'Bestseller' },
  { id: 109, name: 'Cheese Pav Bhaji', note: 'Pav bhaji topped with cheese', price: 149, category: 'Pav & Wraps', veg: true, photo: 21 },
  { id: 110, name: 'Paneer Pav Bhaji', note: 'Pav bhaji finished with paneer', price: 169, category: 'Pav & Wraps', veg: true, photo: 21 },
  { id: 111, name: 'Classic Vada Pav', note: 'Mumbai potato vada in a soft pav', price: 70, category: 'Pav & Wraps', veg: true, photo: 22 },
  { id: 112, name: 'Butter Vada Pav', note: 'Classic vada pav toasted in butter', price: 80, category: 'Pav & Wraps', veg: true, photo: 22 },
  { id: 113, name: 'Schezwan Vada Pav', note: 'Vada pav with fiery Schezwan chutney', price: 90, category: 'Pav & Wraps', veg: true, photo: 22 },
  { id: 114, name: 'Cheese Vada Pav', note: 'Mumbai vada pav with cheese', price: 120, category: 'Pav & Wraps', veg: true, photo: 22 },
  { id: 115, name: 'Veg Shawarma', note: 'Vegetables and sauces in a warm wrap', price: 99, category: 'Pav & Wraps', veg: true, photo: 19 },
  { id: 116, name: 'Paneer Shawarma', note: 'Spiced paneer and salad wrap', price: 119, category: 'Pav & Wraps', veg: true, photo: 19 },
  { id: 117, name: 'Falafel Shawarma', note: 'Falafel, salad and tahini-style sauce', price: 119, category: 'Pav & Wraps', veg: true, photo: 19 },
  { id: 118, name: 'Chicken Shawarma', note: 'Roasted chicken, salad and sauce', price: 129, category: 'Pav & Wraps', veg: false, photo: 19, badge: 'Popular' },
  { id: 119, name: 'Chicken Tikka Shawarma', note: 'Chicken tikka in a toasted wrap', price: 149, category: 'Pav & Wraps', veg: false, photo: 19 },
  { id: 120, name: 'Veg Kathi Roll', note: 'Spiced vegetables in a flaky roll', price: 89, category: 'Pav & Wraps', veg: true, photo: 20 },
  { id: 121, name: 'Paneer Kathi Roll', note: 'Paneer tikka and onions in a roll', price: 119, category: 'Pav & Wraps', veg: true, photo: 20 },
  { id: 122, name: 'Chicken Kathi Roll', note: 'Spiced chicken and onions in a roll', price: 139, category: 'Pav & Wraps', veg: false, photo: 20 },

  { id: 123, name: 'Margherita Pizza', note: 'Mozzarella, basil and tomato sauce', price: 249, category: 'Pizza', veg: true, photo: 23 },
  { id: 124, name: 'Garden Fresh Pizza', note: 'Fresh vegetables, olives and mozzarella', price: 299, category: 'Pizza', veg: true, photo: 23 },
  { id: 125, name: 'Mushroom & Corn Pizza', note: 'Roasted mushrooms, sweet corn and cheese', price: 249, category: 'Pizza', veg: true, photo: 23 },
  { id: 126, name: 'Peri Peri Veg Pizza', note: 'Peri peri vegetables and mozzarella', price: 299, category: 'Pizza', veg: true, photo: 23 },
  { id: 127, name: 'BBQ Chicken Pizza', note: 'Smoky BBQ chicken, onions and cheese', price: 349, category: 'Pizza', veg: false, photo: 24, badge: 'Bestseller' },
  { id: 128, name: 'Peri Peri Chicken Pizza', note: 'Peri peri chicken, peppers and mozzarella', price: 399, category: 'Pizza', veg: false, photo: 24 },
];

export const categories = ['All', 'Rice & Paratha', 'Tea & Maggi', 'Momos', 'Indo-Chinese', 'South Indian', 'Drinks', 'Chaat', 'Pav & Wraps', 'Pizza'];

export type OrderRecord = {
  id: string;
  orderNumber: string;
  orderType: string;
  tableNumber: string | null;
  customerName: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  notes?: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: number;
  items?: { menuItemId: number; name: string; quantity: number; unitPrice: number }[];
};

export type BookingRecord = {
  id: string;
  bookingNumber: string;
  customerName: string;
  phone: string;
  guests: number;
  bookingDate: string;
  bookingTime: string;
  tableNumber: string;
  notes: string | null;
  status: 'booked' | 'completed' | 'cancelled';
  createdAt: number;
  updatedAt: number;
};

const now = Date.now();

export const demoOrders: OrderRecord[] = [
  { id: 'demo-1', orderNumber: 'TRP-1048', orderType: 'Dine in', tableNumber: '05', customerName: 'Mehra', status: 'new', paymentStatus: 'pending', paymentMethod: null, subtotal: 820, tax: 41, discount: 0, total: 861, createdAt: now - 4 * 60000, items: [{ menuItemId: 4, name: 'Butter Chicken', quantity: 1, unitPrice: 395 }, { menuItemId: 6, name: 'Hyderabadi Biryani', quantity: 1, unitPrice: 425 }] },
  { id: 'demo-2', orderNumber: 'TRP-1047', orderType: 'Dine in', tableNumber: '11', customerName: null, status: 'new', paymentStatus: 'pending', paymentMethod: null, subtotal: 665, tax: 33, discount: 0, total: 698, createdAt: now - 7 * 60000, items: [{ menuItemId: 1, name: 'Paneer Tikka', quantity: 1, unitPrice: 295 }, { menuItemId: 3, name: 'Dal Tripti', quantity: 1, unitPrice: 285 }, { menuItemId: 7, name: 'Garlic Naan', quantity: 1, unitPrice: 85 }] },
  { id: 'demo-3', orderNumber: 'TRP-1045', orderType: 'Takeaway', tableNumber: null, customerName: 'Riya', status: 'preparing', paymentStatus: 'paid', paymentMethod: 'UPI', subtotal: 770, tax: 39, discount: 0, total: 809, createdAt: now - 15 * 60000, items: [{ menuItemId: 5, name: 'Kadhai Paneer', quantity: 1, unitPrice: 335 }, { menuItemId: 7, name: 'Garlic Naan', quantity: 2, unitPrice: 85 }, { menuItemId: 8, name: 'Mango Lassi', quantity: 1, unitPrice: 145 }] },
  { id: 'demo-4', orderNumber: 'TRP-1043', orderType: 'Delivery', tableNumber: null, customerName: 'Kabir', status: 'preparing', paymentStatus: 'paid', paymentMethod: 'Card', subtotal: 965, tax: 48, discount: 50, total: 963, createdAt: now - 22 * 60000, items: [{ menuItemId: 10, name: 'Lucknowi Galouti', quantity: 1, unitPrice: 445 }, { menuItemId: 3, name: 'Dal Tripti', quantity: 1, unitPrice: 285 }, { menuItemId: 7, name: 'Garlic Naan', quantity: 1, unitPrice: 85 }, { menuItemId: 12, name: 'Nimbu Soda', quantity: 1, unitPrice: 105 }] },
  { id: 'demo-5', orderNumber: 'TRP-1041', orderType: 'Dine in', tableNumber: '03', customerName: null, status: 'ready', paymentStatus: 'pending', paymentMethod: null, subtotal: 900, tax: 45, discount: 0, total: 945, createdAt: now - 28 * 60000, items: [{ menuItemId: 2, name: 'Murgh Malai Tikka', quantity: 1, unitPrice: 345 }, { menuItemId: 4, name: 'Butter Chicken', quantity: 1, unitPrice: 395 }, { menuItemId: 7, name: 'Garlic Naan', quantity: 2, unitPrice: 85 }] },
  { id: 'demo-6', orderNumber: 'TRP-1039', orderType: 'Dine in', tableNumber: '14', customerName: 'Anand', status: 'completed', paymentStatus: 'paid', paymentMethod: 'Cash', subtotal: 1240, tax: 62, discount: 100, total: 1202, createdAt: now - 49 * 60000, items: [{ menuItemId: 1, name: 'Paneer Tikka', quantity: 2, unitPrice: 295 }, { menuItemId: 5, name: 'Kadhai Paneer', quantity: 1, unitPrice: 335 }, { menuItemId: 7, name: 'Garlic Naan', quantity: 2, unitPrice: 85 }, { menuItemId: 8, name: 'Mango Lassi', quantity: 1, unitPrice: 145 }] },
];

export type StockItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderAt: number;
};

export const demoInventory: StockItem[] = [
  { id: 'paneer', name: 'Fresh paneer', category: 'Dairy', unit: 'kg', quantity: 18, reorderAt: 8 },
  { id: 'chicken', name: 'Boneless chicken', category: 'Meat', unit: 'kg', quantity: 12, reorderAt: 10 },
  { id: 'basmati', name: 'Basmati rice', category: 'Dry goods', unit: 'kg', quantity: 38, reorderAt: 15 },
  { id: 'cream', name: 'Fresh cream', category: 'Dairy', unit: 'L', quantity: 6, reorderAt: 7 },
  { id: 'tomato', name: 'Tomatoes', category: 'Produce', unit: 'kg', quantity: 9, reorderAt: 8 },
  { id: 'atta', name: 'Tandoori atta', category: 'Dry goods', unit: 'kg', quantity: 24, reorderAt: 12 },
  { id: 'mint', name: 'Fresh mint', category: 'Produce', unit: 'bunch', quantity: 5, reorderAt: 6 },
  { id: 'mango', name: 'Mango pulp', category: 'Beverage', unit: 'L', quantity: 14, reorderAt: 5 },
];
