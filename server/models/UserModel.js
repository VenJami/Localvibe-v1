const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your Name"],
    },
    userName: {
      type: String,
    },
    firstName: {
      type: String,
      required: [true, "Please enter your first name"],
    },
    lastName: {
      type: String,
      required: [true, "Please enter your last name"],
    },
    bio: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
    },
    accountType: {
      type: String,
      enum: ["admin", "personal", "business", "prembusiness"],
      default: "personal",
      required: [true, "Please specify the account type"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    avatar: {
      public_id: {
        type: String,
        required: [true, "Please upload one profile picture!"],
      },
      url: {
        type: String,
        required: [true, "Please upload one profile picture!"],
      },
    },
    coverPhoto: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    followers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    following: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      },
    ],
    interactions: [
      {
        post_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
          required: true,
        },
        score: {
          type: Number,
          default: 0,
        },
      },
    ],
    similarUsers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        similarityScore: {
          type: Number,
          default: 0,
        },
      },
    ],
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
