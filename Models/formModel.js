const fs = require("fs");
const mongoose = require("mongoose");
const validator = require("validator");
const multer = require("multer");
const { type } = require("os");
const { validate } = require("./userModel");

const movieSchema = new mongoose.Schema(
  {
    applicantName: {
      type: String,
      required: [true, "Applicant name filed is required!"],
      trim: true,
      maxLength: [100, "Name should not exceed 100 characters"],
      minLength: [4, "Name should be greater than 4 character"],
    },
    applicationId: {
      type: String,
      unique: true,
    },
    dob: {
      type: Date,
      required: [true, "Applicant DOB is required!"],
    },
    nationality: {
      type: String,
      default: "India",
      required: [true, "Nationality is required!"],
    },
    aadharNumber: {
      type: String,
      unique: true,
      required: [true, "Aadhar number is mandatory field"],
      minLength: 12,
      maxLength: 12,
    },
    panNumber: {
      type: String,
      unique: true,
      required: [true, "Pan Number is mandatory field"],
      validate: [validator.isAlphanumeric, "Enter valid pan number"],
    },
    emailId: {
      type: String,
      unique: true,
      // required: [true, "Email ID is required"],
      validate: [validator.isEmail, "Enter valid email"],
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: [true, "Phone number field is required"],
      validate: [validator.isMobilePhone, "Enter valid mobile number"],
    },
    residentialAddress: {
      type: String,
      required: [true, "Residential Address is required"],
    },
    permanentAddress: {
      type: String,
      required: [true, "permanent Address is required"],
    },
    employmentType: {
      type: String,
      required: [true, "Employment type is required"],
    },
    companyName: {
      type: String,
    },
    selfEmploymentType: {
      type: String,
    },
    bussinessType: {
      type: String,
    },
    income: {
      type: Number,
      required: [true, "Income field is mandatory"],
    },
    bankName: {
      type: String,
      required: [true, "Bank Name is required"],
    },
    accountNumber: {
      type: String,
      unique: true,
      required: [true, "Account number is required"],
      minLength: 9,
      maxLength: 18,
    },
    ifscCode: {
      type: String,
      required: [true, "IFSC code is required"],
      minLength: 11,
      maxLength: 11,
    },
    loanAmount: {
      type: Number,
      required: [true, "Loan amount is required"],
    },
    loanTenure: {
      type: Number,
      required: [true, "Loan Tenure is required"],
      max: 50,
    },
    loanPurpose: {
      type: String,
      required: [true, "Loan purpose is required"],
    },
    status: {
      type: String,
      default: "Pending",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const Form = mongoose.model("Form", movieSchema);

module.exports = Form;
