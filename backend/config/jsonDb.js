const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'db_fallback.json');

// Helper to ensure data folder exists
const initDbFile = () => {
  const dir = path.dirname(DB_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const defaultData = {
      users: [
        {
          id: 'admin-1',
          username: 'admin',
          email: 'admin@kdnsport.com',
          password: '$2a$10$8zuLNbvla6fNhwtc8o6BEusp5GK2tRUqlfuby0OyANpWL7p63QaHi', // bcrypt hash for 'admin123'
          role: 'admin',
          createdAt: new Date().toISOString()
        }
      ],
      bookings: [],
      gymMembers: [],
      products: [
        {
          id: 'prod-1',
          name: 'KDN Premium Whey Isolate',
          description: 'High-quality micro-filtered whey protein isolate with 25g protein per serving. Perfect for post-workout muscle recovery.',
          price: 16497.00,
          image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60',
          category: 'protein',
          stock: 45,
          rating: 4.8,
          allowKoko: true
        },
        {
          id: 'prod-2',
          name: 'KDN Pre-Workout Ignite',
          description: 'High-energy pump formula with Beta-Alanine, L-Citrulline, and Caffeine to boost workout performance and focus.',
          price: 10497.00,
          image: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=500&auto=format&fit=crop&q=60',
          category: 'pre-workout',
          stock: 30,
          rating: 4.6,
          allowKoko: true
        },
        {
          id: 'prod-3',
          name: 'KDN Creatine Monohydrate',
          description: '100% pure micronized creatine monohydrate. Promotes explosive strength, power, and muscle mass.',
          price: 7497.00,
          image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
          category: 'creatine',
          stock: 100,
          rating: 4.9,
          allowKoko: true
        },
        {
          id: 'prod-4',
          name: 'KDN BCAA Recovery Matrix',
          description: 'Branched-chain amino acids in a 2:1:1 ratio. Aids in intra-workout hydration, endurance, and reduces muscle soreness.',
          price: 8997.00,
          image: 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?w=500&auto=format&fit=crop&q=60',
          category: 'recovery',
          stock: 40,
          rating: 4.5,
          allowKoko: true
        },
        {
          id: 'prod-5',
          name: 'KDN Joint Support Formula',
          description: 'Advanced joint recovery complex containing Glucosamine, Chondroitin, and MSM. Ideal for heavy lifters and athletes.',
          price: 5997.00,
          image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=60',
          category: 'vitamins',
          stock: 25,
          rating: 4.7,
          allowKoko: true
        }
      ],
      orders: [],
      systemConfig: {
        isShutdown: false,
        secretAdminOtp: null,
        otpExpiry: null
      }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf8');
  }
};

const readDb = () => {
  initDbFile();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON fallback database:', err);
    return {};
  }
};

const writeDb = (data) => {
  initDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing JSON fallback database:', err);
    return false;
  }
};

// Generic collection CRUD operations
const getCollection = (collectionName) => {
  return {
    find: (filter = {}) => {
      const db = readDb();
      let items = db[collectionName] || [];
      return items.filter(item => {
        for (let key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
    },
    findOne: (filter = {}) => {
      const db = readDb();
      let items = db[collectionName] || [];
      return items.find(item => {
        for (let key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      }) || null;
    },
    findById: (id) => {
      const db = readDb();
      let items = db[collectionName] || [];
      return items.find(item => item.id === id) || null;
    },
    create: (data) => {
      const db = readDb();
      if (!db[collectionName]) db[collectionName] = [];
      
      const newDoc = {
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString(),
        ...data
      };
      
      db[collectionName].push(newDoc);
      writeDb(db);
      return newDoc;
    },
    findByIdAndUpdate: (id, updateData) => {
      const db = readDb();
      let items = db[collectionName] || [];
      const index = items.findIndex(item => item.id === id);
      if (index === -1) return null;
      
      items[index] = {
        ...items[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      return items[index];
    },
    updateOne: (filter, updateData) => {
      const db = readDb();
      let items = db[collectionName] || [];
      const index = items.findIndex(item => {
        for (let key in filter) {
          if (item[key] !== filter[key]) return false;
        }
        return true;
      });
      
      if (index === -1) return null;
      items[index] = {
        ...items[index],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      writeDb(db);
      return items[index];
    },
    deleteOne: (filter) => {
      const db = readDb();
      let items = db[collectionName] || [];
      const initialLength = items.length;
      db[collectionName] = items.filter(item => {
        for (let key in filter) {
          if (item[key] === filter[key]) return false;
        }
        return true;
      });
      writeDb(db);
      return { deletedCount: initialLength - db[collectionName].length };
    }
  };
};

module.exports = {
  Users: getCollection('users'),
  Bookings: getCollection('bookings'),
  GymMembers: getCollection('gymMembers'),
  Products: getCollection('products'),
  Orders: getCollection('orders'),
  SystemConfig: {
    get: () => {
      const db = readDb();
      return db.systemConfig || { isShutdown: false, secretAdminOtp: null, otpExpiry: null };
    },
    set: (updateData) => {
      const db = readDb();
      db.systemConfig = {
        ...db.systemConfig,
        ...updateData
      };
      writeDb(db);
      return db.systemConfig;
    }
  }
};
