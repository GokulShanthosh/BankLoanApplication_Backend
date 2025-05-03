const CustomError = require("../Utils/customError");
const multer = require('multer');

const handleCastErrorDb = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new CustomError(message, 400);
};

const handleDuplicateFieldsDb = (err) => {
  console.log(err.stack);

  const value = err.errmsg.match("(.*?)")[0];

  const message = `Duplicate value ${value}. Enter proper movie!`;

  return new CustomError(message, 400);
};

const handleValidationErrorDb = (err) => {
  const errors = Object.values(err.errors).map((val) => val.message);

  const message = `Invalid input data. ${errors.join(". ")}`;

  return new CustomError(message, 400);
};

const handleJsonWebTokenError = (err) => {
  const message = `Invalid token! Please login again`;
  return new CustomError(message, 401);
};

const handleTokenExpiredError = (err) => {
  const message = `Token Expired! please login again`;
  return new CustomError(message, 401);
};

const SendErrordev = (err, res) => {
  res.status(err.statusCode).json({
    // status: err.status,
    error: err,
    // message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  console.log(err.isOperational);

  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("Error:", err);

    res.status(500).json({
      status: "Error",
      message: "Sorry! Something went wrong",
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    SendErrordev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (err.name === "CastError") error = handleCastErrorDb(err);

    if (err.code === 11000) error = handleDuplicateFieldsDb(err);

    if (err.name === "ValidationError") error = handleValidationErrorDb(err);

    if (err.name === "JsonWebTokenError") error = handleJsonWebTokenError(err);

    if (err.name === "TokenExpiredError") error = handleTokenExpiredError(err);

    sendErrorProd(error, res);
  }
};
