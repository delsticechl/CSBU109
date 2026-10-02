require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

// Base User Schema Definition
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  password: {
    type: String,
    required: false
  },
  // --- QUESTION 1: Custom Validation with Regex for Vietnamese Phone Numbers ---
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty if optional
        return /^(03|05|07|08|09)\d{8}$/.test(v);
      },
      message: props => `${props.value} is not a valid Vietnamese phone number!`
    }
  },
  age: {
    type: Number,
    min: [18, 'User age must be at least 18'],
    max: [100, 'Invalid age']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'manager'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // --- QUESTION 4: Soft Delete Flag ---
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
// --- QUESTION 4: Instance Methods (Soft Delete) ---
userSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.isActive = false;
  return await this.save();
};

// --- QUESTION 2: Virtual Properties ---
userSchema.virtual('displayInfo').get(function() {
  return `${this.fullName} <${this.email}> [${this.role ? this.role.toUpperCase() : 'USER'}]`;
});

// --- QUESTION 3: Static Methods ---
userSchema.statics.findActiveByRole = function(roleName) {
  return this.find({ role: roleName, isActive: true, isDeleted: false })
             .sort({ fullName: 1 });
};


// --- QUESTION 5: Middleware Hooks ---
// Pre-save hook (Simulating password hashing)
userSchema.pre('save', function() {
  if (this.isModified('password') && this.password) {
    console.log(`[Middleware Pre-save] Simulating password hash for user: ${this.fullName}`);
    this.password = `hashed_${this.password}_secret`;
  }
});

// Pre-find query hook (Automatically filter out soft-deleted documents)
userSchema.pre(/^find/, function() {
  this.where({ isDeleted: { $ne: true } });
});

const User = mongoose.model('User', userSchema);

async function runExercise3() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("-> Connected to MongoDB via Mongoose successfully!\n");

    await User.deleteMany({});

    // --- QUESTION 1 Test: Trigger invalid phone validation ---
    console.log("=== QUESTION 1: Testing Invalid Phone Validation ===");
    try {
      await User.create({
        fullName: "Test Phone Invalid",
        email: "phone.invalid@example.com",
        phone: "1234567890", // Invalid prefix
        age: 25
      });
    } catch (err) {
      console.log("Validation error caught successfully:", err.message, "\n");
    }

    const user1 = await User.create({
      fullName: "Nguyen Van An",
      email: "an.nguyen@example.com",
      phone: "0912345678",
      password: "mySecretPassword123",
      age: 22,
      role: "admin",
      isActive: true
    });

    const user2 = await User.create({
      fullName: "Tran Thi Binh",
      email: "binh.tran@example.com",
      phone: "0987654321",
      password: "password456",
      age: 30,
      role: "admin",
      isActive: true
    });

    // --- QUESTION 2 Test: Virtual Property ---
    console.log("=== QUESTION 2: Virtual Field displayInfo ===");
    console.log("Virtual output:", user1.displayInfo);
    console.log("JSON Serialized:", JSON.stringify(user1.toJSON()), "\n");

    // --- QUESTION 3 Test: Static Method ---
    console.log("=== QUESTION 3: Calling Static Method findActiveByRole('admin') ===");
    const activeAdmins = await User.findActiveByRole('admin');
    console.log("Active Admins (Sorted A-Z):", activeAdmins.map(u => u.fullName), "\n");

    // --- QUESTION 4 Test: Instance Method Soft Delete ---
    console.log("=== QUESTION 4: Soft Deleting user1 ===");
    await user1.softDelete();
    console.log(`Soft deleted user1 (${user1.fullName}). isDeleted = ${user1.isDeleted}, isActive = ${user1.isActive}\n`);

    // --- QUESTION 5 Test: Query Hook Verification ---
    console.log("=== QUESTION 5: Finding All Users (Testing Query Hook filtering isDeleted) ===");
    const remainingUsers = await User.find({});
    console.log("Number of active users returned:", remainingUsers.length);
    console.log("Available users list:", remainingUsers.map(u => u.fullName));

  } catch (error) {
    console.error("Mongoose Error:", error.message);
  } finally {
    await mongoose.connection.close();
    console.log("\n-> Closed Mongoose connection.");
  }
}

runExercise3();