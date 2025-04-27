const User = require("./../Models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const jwt = require("jsonwebtoken");
const CustomError = require("./../Utils/CustomError");
const sendEmail = require("./../Utils/email");
const { log } = require("console");
const { promisify } = require("util");
const crypto = require("crypto");

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECERT_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signUp = catchAsync(async (req, res, next) => {
  //helps to store only the required data by mentioning by field
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role || "user",
  });

  // const token = signToken(newUser._id);

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1. Check if the email and password exists
  if (!email || !password) {
    return next(new CustomError("Please enter email and password!", 400));
  }
  //2. Check if the user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  // @ts-ignore
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new CustomError("Incorrect Username or Password", 401));
  }
  //3. If everything is ok, then send the token

  createSendToken(user, 200, res);
});

// @ts-ignore
exports.protect = catchAsync(async (req, res, next) => {
  //1. Getting token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  // console.log(token);

  if (!token) {
    return next(new CustomError("You are not logged in! please login", 401));
  }
  //2. Verification token
  const decoded = await promisify(jwt.verify)(
    token,
    // @ts-ignore
    process.env.JWT_SECERT_KEY
  );
  // console.log(decoded);

  //3. Check if the user still exists

  const freshUser = await User.findById(decoded.id);
  if (!freshUser) {
    return next(
      new CustomError("The user belonging for this token no longer exsist", 401)
    );
  }
  //4. Check if user changed password after the token was issued
  if (freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new CustomError(
        "User changed password recently! Please log in again.",
        401
      )
    );
  }

  //Grand Access to protected route
  req.user = freshUser;
  next();
});

exports.restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    //roles is an array ['admin']

    if (!roles.includes(req.user.role)) {
      return next(
        new CustomError(
          "You do not have permission to perform this action",
          403
        )
      ); //403-forbidden
    }
    next();
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1. get users based on posted emails
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new CustomError("There is no user with the provided email address", 404)
    );
  }
  //2. generate random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  //3. Send it to user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password! Submit a patch request with your new password and passwordConfirm to: ${resetURL}.\n If you did not forget your password please ignore this mail`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token sent! Valid for 10 mins!",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (err) {
    user.PasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new CustomError(
        "There was an error in send email! Please try again after some time!",
        500
      )
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1. Get user based on the token
  const hasedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hasedToken,
    passwordResetExpires: { $gt: Date.now() }, //checking if there is time for reset token
  });

  if (!user) {
    return next(new CustomError("Token Invalid or expired!", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 201, res);

  // 2. If the token has not expired, and there is user,set the new password
  // 3.Update the changedPasswordAt property for the user
  // 4.Log the user in and send the jwt
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) get user from collection
  const user = await User.findById(req.user.id).select("+password");

  const userId = req.user.id;
  console.log(`User ID: ${userId}`);

  // 2) Check if the posted current password is correct

  // 3) If so update password
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new CustomError("Entered password is wrong!", 401));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // 4)log in user, sent jwt
  createSendToken(user, 200, res);
});
