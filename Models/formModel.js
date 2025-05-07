const mongoose = require("mongoose");
const validator = require("validator");
const path = require("path");

const formSchema = new mongoose.Schema(
  {
    // Personal Details
    applicantName: {
      type: String,
      required: [true, "Applicant name field is required!"],
      trim: true,
      maxLength: [100, "Name should not exceed 100 characters"],
      minLength: [4, "Name should be at least 4 characters"]
    },
    applicationId: {
      type: String,
      unique: true,
      index: true
    },
    dob: {
      type: Date,
      required: [true, "Date of birth is required!"]
    },
    gender: {
      type: String,
      required: [true, "Gender is required!"],
      enum: ["male", "female", "other"]
    },
    nationality: {
      type: String,
      default: "India",
      required: [true, "Nationality is required!"]
    },
    aadharNumber: {
      type: String,
      unique: true,
      required: [true, "Aadhar number is required"],
      validate: {
        validator: function(v) {
          return /^\d{12}$/.test(v);
        },
        message: "Aadhar number must be a 12-digit number"
      }
    },
    panNumber: {
      type: String,
      unique: true,
      required: [true, "PAN number is required"],
      validate: {
        validator: function(v) {
          return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: "Invalid PAN number format"
      }
    },
    emailId: {
      type: String,
      required: [true, "Email is required"],
      validate: [validator.isEmail, "Enter valid email address"],
      index: true
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function(v) {
          return /^\d{10}$/.test(v);
        },
        message: "Phone number must be 10 digits"
      }
    },
    residentialAddress: {
      type: String,
      required: [true, "Residential address is required"]
    },
    permanentAddress: {
      type: String,
      required: [true, "Permanent address is required"]
    },
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
      enum: ["salaried", "self_employed", "business"]
    },
    companyName: String,
    selfEmploymentType: String,
    businessType: String,
    income: {
      type: Number,
      required: [true, "Income is required"],
      min: [10000, "Income must be at least ₹10,000"]
    },

    // Bank Details
    bankName: {
      type: String,
      required: [true, "Bank name is required"]
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      validate: {
        validator: function(v) {
          return /^\d{9,18}$/.test(v);
        },
        message: "Account number must be 9-18 digits"
      }
    },
    ifscCode: {
      type: String,
      required: [true, "IFSC code is required"],
      validate: {
        validator: function(v) {
          return /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/.test(v);
        },
        message: "Invalid IFSC code format"
      }
    },

    // Loan Details
    loanType: {
      type: String,
      required: [true, "Loan type is required"],
      enum: ["home", "personal", "vehicle", "business"]
    },
    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required"],
      min: [10000, "Minimum loan amount is ₹10,000"]
    },
    loanTenure: {
      type: Number,
      required: [true, "Loan tenure is required"],
      min: [1, "Minimum tenure is 1 year"],
      max: [50, "Maximum tenure is 50 years"]
    },
    loanPurpose: {
      type: String,
      required: function() {
        return this.loanType === 'personal';
      },
      enum: ["education", "medical", "travel", "wedding", "debt_consolidation", "home_improvement", "other"]
    },
    collateralType: {
      type: String,
      required: function() {
        return this.loanType !== 'personal';
      },
      enum: ["property", "vehicle", "gold", "fd", "stocks", "other"]
    },
    collateralValue: {
      type: Number,
      required: function() {
        return this.loanType !== 'personal';
      },
      min: [10000, "Collateral value must be at least ₹10,000"]
    },
    collateralDescription: {
      type: String,
      required: function() {
        return this.loanType !== 'personal';
      }
    },

    // Document Uploads (Windows path compatible)
    incomeProof: {
      type: String,
      required: [true, "Income proof document is required"],
      validate: {
        validator: function(v) {
          return typeof v === 'string' && v.length > 0;
        },
        message: "Invalid income proof path"
      }
    },
    collateralDocument: {
      type: String,
      required: function() {
        return this.loanType !== 'personal';
      },
      validate: {
        validator: function(v) {
          if (v === null) return true;
          return typeof v === 'string' && v.length > 0;
        },
        message: "Invalid collateral document path"
      }
    },

    // Application Status
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Under Review", "Approved", "Rejected", "Withdrawn"],
      index: true
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret) {
        // Clean up returned data
        delete ret.__v;
        delete ret._id;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

// Fixed virtuals with Windows path handling
formSchema.virtual('incomeProofUrl').get(function() {
  if (!this.incomeProof) return null;
  try {
    // Normalize Windows paths and extract filename
    const normalizedPath = this.incomeProof.replace(/\\/g, '/');
    return `/uploads/${normalizedPath.split('/').pop()}`;
  } catch (error) {
    console.error('Error processing income proof URL:', error);
    return null;
  }
});

formSchema.virtual('collateralDocUrl').get(function() {
  if (!this.collateralDocument) return null;
  try {
    const normalizedPath = this.collateralDocument.replace(/\\/g, '/');
    return `/uploads/${normalizedPath.split('/').pop()}`;
  } catch (error) {
    console.error('Error processing collateral document URL:', error);
    return null;
  }
});

// Pre-save hook to normalize paths
formSchema.pre('save', function(next) {
  // Convert Windows paths to URL-friendly format
  if (this.incomeProof) {
    this.incomeProof = this.incomeProof.replace(/\\/g, '/');
  }
  
  if (this.collateralDocument) {
    this.collateralDocument = this.collateralDocument.replace(/\\/g, '/');
  }

  // Generate application ID if new document
  if (this.isNew && !this.applicationId) {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36)
      .substring(2, 9)
      .toUpperCase();
    this.applicationId = `APP-${timestamp}-${randomStr}`;
  }

  next();
});

// Post-init hook to handle existing data
formSchema.post('init', function(doc) {
  // Ensure paths are normalized when loading from DB
  if (doc.incomeProof) {
    doc.incomeProof = doc.incomeProof.replace(/\\/g, '/');
  }
  if (doc.collateralDocument) {
    doc.collateralDocument = doc.collateralDocument.replace(/\\/g, '/');
  }
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;