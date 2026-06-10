const mongoose = require('mongoose');
const jsonDb = require('./jsonDb');

const MONGO_URI = process.env.MONGO_URI;

let dbType = 'json';

if (MONGO_URI) {
  try {
    // Connect to MongoDB Atlas (we encode special characters like @ automatically if they were not encoded by the user, but we'll try to connect directly first)
    mongoose.connect(MONGO_URI);
    console.log('Database Mode: Initializing connection to MongoDB Atlas...');
    dbType = 'mongodb';
  } catch (err) {
    console.error('Mongoose connection setup failed. Falling back to local database.', err.message);
    dbType = 'json';
  }
}

// Define Schemas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  court: String,
  date: String,
  slot: String,
  userId: String,
  userName: String,
  userEmail: String,
  userPhone: String,
  paymentStatus: String,
  status: String,
  type: { type: String, default: 'court' }, // 'court' or 'physio'
  therapist: String,
  condition: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const GymMemberSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  userName: String,
  userEmail: String,
  tier: String,
  price: Number,
  paymentStatus: String,
  startDate: String,
  endDate: String,
  status: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  description: String,
  price: Number,
  image: String,
  category: String,
  stock: Number,
  rating: Number
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: String,
  userName: String,
  userEmail: String,
  items: Array,
  shippingDetails: {
    name: String,
    address: String,
    phone: String
  },
  totalAmount: Number,
  paymentStatus: String,
  orderStatus: String,
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const SystemConfigSchema = new mongoose.Schema({
  isShutdown: { type: Boolean, default: false },
  secretAdminOtp: String,
  otpExpiry: String
});

// Compile Models
const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongoBooking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const MongoGymMember = mongoose.models.GymMember || mongoose.model('GymMember', GymMemberSchema);
const MongoProduct = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const MongoOrder = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const MongoSystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);

// Connection listener
mongoose.connection.on('connected', async () => {
  console.log('Database Mode: Successfully connected to MongoDB Atlas! Syncing collections...');
  
  try {
    // Seed default supplement products if empty
    const productCount = await MongoProduct.countDocuments();
    if (productCount === 0) {
      console.log('Database Mode: Seeding default supplement products into MongoDB Atlas...');
      const fallbackProducts = jsonDb.Products.find();
      for (let p of fallbackProducts) {
        await MongoProduct.create(p);
      }
    }
    
    // Seed default admin account if empty
    const adminCount = await MongoUser.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('Database Mode: Seeding default admin account into MongoDB Atlas...');
      const fallbackAdmins = jsonDb.Users.find({ role: 'admin' });
      for (let admin of fallbackAdmins) {
        await MongoUser.create(admin);
      }
      console.log('Database Mode: Default admin synced successfully.');
    }
  } catch (err) {
    console.error('Database Mode: Seeding error:', err.message);
  }
});

mongoose.connection.on('error', (err) => {
  console.error('Database Mode: MongoDB Atlas connection error. Falling back to local JSON database.', err.message);
  dbType = 'json';
});

// Adapter mapper translating mongoose operations or jsonDb fallbacks
const getAdapter = (collectionName, MongoModel, jsonCollection) => {
  return {
    find: async (filter = {}) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        return await MongoModel.find(filter).lean();
      }
      return jsonCollection.find(filter);
    },
    findOne: async (filter = {}) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        return await MongoModel.findOne(filter).lean();
      }
      return jsonCollection.findOne(filter);
    },
    findById: async (id) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        return await MongoModel.findOne({ id }).lean();
      }
      return jsonCollection.findById(id);
    },
    create: async (data) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        const id = Math.random().toString(36).substr(2, 9);
        const doc = await MongoModel.create({ id, ...data });
        return doc.toObject();
      }
      return jsonCollection.create(data);
    },
    findByIdAndUpdate: async (id, updateData) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        const doc = await MongoModel.findOneAndUpdate({ id }, { $set: updateData }, { new: true });
        return doc ? doc.toObject() : null;
      }
      return jsonCollection.findByIdAndUpdate(id, updateData);
    },
    updateOne: async (filter, updateData) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        const doc = await MongoModel.findOneAndUpdate(filter, { $set: updateData }, { new: true });
        return doc ? doc.toObject() : null;
      }
      return jsonCollection.updateOne(filter, updateData);
    },
    deleteOne: async (filter) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        const result = await MongoModel.deleteOne(filter);
        return { deletedCount: result.deletedCount };
      }
      return jsonCollection.deleteOne(filter);
    }
  };
};

module.exports = {
  dbType: () => dbType,
  Users: getAdapter('users', MongoUser, jsonDb.Users),
  Bookings: getAdapter('bookings', MongoBooking, jsonDb.Bookings),
  GymMembers: getAdapter('gymMembers', MongoGymMember, jsonDb.GymMembers),
  Products: getAdapter('products', MongoProduct, jsonDb.Products),
  Orders: getAdapter('orders', MongoOrder, jsonDb.Orders),
  SystemConfig: {
    get: async () => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        let config = await MongoSystemConfig.findOne().lean();
        if (!config) {
          config = await MongoSystemConfig.create({ isShutdown: false });
        }
        return config;
      }
      return jsonDb.SystemConfig.get();
    },
    set: async (updateData) => {
      if (dbType === 'mongodb' && mongoose.connection.readyState === 1) {
        let config = await MongoSystemConfig.findOne();
        if (!config) {
          config = await MongoSystemConfig.create({ isShutdown: false, ...updateData });
        } else {
          config = await MongoSystemConfig.findOneAndUpdate({}, { $set: updateData }, { new: true });
        }
        return config ? config.toObject() : null;
      }
      return jsonDb.SystemConfig.set(updateData);
    }
  }
};
