const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { deflate } = require("zlib");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name field is required!"],
  },
  email: {
    type: String,
    required: [true, "Email Field is mandatory!"],
    lowercase: true,
    validate: [validator.isEmail, "Enter proper email Id"],
    unique: true,
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
  },
  password: {
    type: String,
    required: [true, "Please enter password"],
    minLength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"], // More descriptive message
    validate: {
      // This only works on SAVE!!!
      validator: function (el) {
        // @ts-ignore
        return el === this.password;
      },
      message: "Passwords do not match!",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

//Instance method (available throughout the collection|| on all user document) and this method is used to check the login password and db
// password are same
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      (this.passwordChangedAt.getTime() / 1000).toString()
    );

    // console.log(changedTimeStamp, JWTTimeStamp);

    return JWTTimeStamp < changedTimeStamp; //100<200 true
  }

  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
