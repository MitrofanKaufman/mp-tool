// mock-data/api-mocks.js
export const mockData = {
  suggest: (query) => [
    { value: `${query} телефон` , count: 1234 },
    { value: `${query} наушники` , count: 567 },
    { value: `${query} аксессуары` , count: 234 }
  ],

  search: (query) => ({
    products: [
      { 
        id: 123456, 
        name: `Смартфон ${query} Pro` , 
        price: 29999, 
        brand: 'Xiaomi',
        rating: 4.7
      }
    ],
    total: 156
  }),

  product: (id) => ({
    nm_id: id,
    title: `Товар ${id}` ,
    price: 89999,
    brand: 'Apple',
    rating: 4.8
  }),

  brand: (id) => ({
    id: id,
    name: 'Apple',
    products_count: 15600,
    rating: 4.9
  }),

  seller: (id) => ({
    supplier_id: parseInt(id),
    name: 'Official Store',
    rating: 4.9,
    reviews_count: 45678
  })
};

export const generateMockTableData = (table, limit) => {
  const data = [];
  const now = new Date();
  
  for (let i = 0; i < limit; i++) {
    switch (table) {
      case 'products':
        data.push({
          id: i + 1,
          nm_id: 1000000 + i,
          title: `Товар ${i + 1}` ,
          brand: `Бренд ${i % 5}` ,
          price: 1000 + i * 100,
          rating: (4 + Math.random()).toFixed(1)
        });
        break;
        
      case 'tasks':
        data.push({
          id: i + 1,
          type: ['search', 'product', 'brand', 'seller'][i % 4],
          status: ['completed', 'running', 'failed'][i % 3],
          created_at: new Date(now - i * 60000).toISOString()
        });
        break;
        
      default:
        data.push({ 
          id: i + 1, 
          name: `Запись ${i + 1}` 
        });
    }
  }
  
  return data;
};
