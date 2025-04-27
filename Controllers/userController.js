const { stat } = require("fs");
const User = require("./../Models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const CustomError = require("./../Utils/CustomError");

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if the user enters password or confirm password
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new CustomError(
        "This route is not for password update. Please use /updatePassword !"
      )
    );
  }

  // 2) filter unwanted fields that are not allowed to be updated
  const filteredObj = filterObj(req.body, "name", "email");
  // 3) update the user data
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredObj, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
