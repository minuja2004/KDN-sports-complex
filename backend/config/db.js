const mongoose = require('mongoose');
const jsonDb = require('./jsonDb');

const MONGO_URI = process.env.MONGO_URI;

let dbType = 'json';

if (MONGO_URI) {
  console.log('Database Mode: Initializing connection to MongoDB Atlas...');
  dbType = 'mongodb';
  mongoose.connect(MONGO_URI).catch(err => {
    console.error('Database Mode: Mongoose connection setup failed. Falling back to local database.', err.message);
    dbType = 'json';
  });
}

// Define Schemas
const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: "" },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' },
  isActive: { type: Boolean, default: true },
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
  images: { type: [String], default: [] },
  category: String,
  stock: Number,
  rating: Number,
  allowKoko: { type: Boolean, default: false },
  isMultipleOption: { type: Boolean, default: false },
  optionTitle: { type: String, default: "" },
  selectionType: { type: String, default: "dropdown" },
  selections: { type: [mongoose.Schema.Types.Mixed], default: [] }
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
  paymentMethod: { type: String, default: 'card' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const SystemConfigSchema = new mongoose.Schema({
  isShutdown: { type: Boolean, default: false },
  secretAdminOtp: String,
  otpExpiry: String
});

const FlyerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  image: { type: String, required: true },
  link: { type: String, default: "" },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

const OtpVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  otpExpiry: { type: String, required: true }
});

// Compile Models
const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
const MongoBooking = mongoose.models.Booking || mongoose.model('Booking', BookingSchema);
const MongoGymMember = mongoose.models.GymMember || mongoose.model('GymMember', GymMemberSchema);
const MongoProduct = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const MongoOrder = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const MongoSystemConfig = mongoose.models.SystemConfig || mongoose.model('SystemConfig', SystemConfigSchema);
const MongoFlyer = mongoose.models.Flyer || mongoose.model('Flyer', FlyerSchema);
const MongoOtpVerification = mongoose.models.OtpVerification || mongoose.model('OtpVerification', OtpVerificationSchema);

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
    
    // Guarantee admin@kdnsport.com exists with password 'admin123'
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const adminEmail = 'admin@kdnsport.com';
    
    const existingAdmin = await MongoUser.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('Database Mode: Synchronizing/Resetting admin password to "admin123"...');
      await MongoUser.updateOne({ email: adminEmail }, { $set: { password: hashedPassword } });
      console.log('Database Mode: Admin credentials updated.');
    } else {
      console.log('Database Mode: Admin account not found. Seeding admin@kdnsport.com...');
      const id = Math.random().toString(36).substr(2, 9);
      await MongoUser.create({
        id,
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Database Mode: Admin seeded successfully.');
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
  Flyers: getAdapter('flyers', MongoFlyer, jsonDb.Flyers),
  OtpVerifications: getAdapter('otpVerifications', MongoOtpVerification, jsonDb.OtpVerifications),
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
