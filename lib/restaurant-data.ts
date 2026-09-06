export type MenuItem = {
  id: number;
  name: string;
  note: string;
  price: number;
  category: string;
  veg: boolean;
  tone: string;
};

export const menu: MenuItem[] = [
  { id: 1, name: 'Paneer Tikka', note: 'Charred cottage cheese · mint', price: 295, category: 'Starters', veg: true, tone: 'from-orange-300 to-amber-100' },
  { id: 2, name: 'Murgh Malai Tikka', note: 'Creamy chicken · cardamom', price: 345, category: 'Starters', veg: false, tone: 'from-rose-300 to-orange-100' },
  { id: 3, name: 'Dal Tripti', note: 'Slow-cooked black lentils · butter', price: 285, category: 'Mains', veg: true, tone: 'from-amber-400 to-yellow-100' },
  { id: 4, name: 'Butter Chicken', note: 'Tandoori chicken · tomato gravy', price: 395, category: 'Mains', veg: false, tone: 'from-red-300 to-orange-100' },
  { id: 5, name: 'Kadhai Paneer', note: 'Peppers · coriander · tomato', price: 335, category: 'Mains', veg: true, tone: 'from-yellow-300 to-lime-100' },
  { id: 6, name: 'Hyderabadi Biryani', note: 'Saffron rice · chicken · raita', price: 425, category: 'Rice', veg: false, tone: 'from-orange-400 to-yellow-100' },
  { id: 7, name: 'Garlic Naan', note: 'Tandoor-baked · garlic butter', price: 85, category: 'Breads', veg: true, tone: 'from-amber-200 to-orange-50' },
  { id: 8, name: 'Mango Lassi', note: 'Alphonso mango · yoghurt', price: 145, category: 'Drinks', veg: true, tone: 'from-yellow-300 to-amber-50' },
  { id: 9, name: 'Dahi ke Kebab', note: 'Hung curd · smoked pepper', price: 315, category: 'Starters', veg: true, tone: 'from-yellow-200 to-rose-100' },
  { id: 10, name: 'Lucknowi Galouti', note: 'Tender lamb · ulte tawa paratha', price: 445, category: 'Starters', veg: false, tone: 'from-red-400 to-amber-100' },
  { id: 11, name: 'Shahi Kofta', note: 'Paneer dumplings · cashew gravy', price: 355, category: 'Mains', veg: true, tone: 'from-amber-300 to-orange-100' },
  { id: 12, name: 'Nimbu Soda', note: 'Fresh lime · roasted cumin', price: 105, category: 'Drinks', veg: true, tone: 'from-lime-200 to-yellow-50' },
];

export const categories = ['All', 'Starters', 'Mains', 'Rice', 'Breads', 'Drinks'];

export type OrderRecord = {
  id: string;
  orderNumber: string;
  orderType: string;
  tableNumber: string | null;
  customerName: string | null;
  status: string;
  paymentStatus: string;
  paymentMethod: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  createdAt: number;
  items?: { menuItemId: number; name: string; quantity: number; unitPrice: number }[];
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
