const express = require("express");
let app = express();
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const hpp = require("hpp");
const cors = require("cors");

const applicationRouter = require("./Routes/applicationRouter");
const userRouter = require("./Routes/userRouter");
const CustomError = require("./Utils/customError");
const globalErrorHandler = require("./Controllers/errorController");

//Help secure Express apps by setting HTTP response headers.
app.use(helmet());

//Allow request from angular app
app.use(
  cors({
    origin: `http://localhost:4200`,
    credentials: true,
  })
);

//used in development for logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//used to limit the request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "To many requests for this IP. please try again after some time!",
});
app.use("/api", limiter);

// Data sanitization against XXS attacks
// app.use(xss());

//used to parse the req.body so that we can access the req.body
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

//Data sanitization against noSql query injection
// app.use(mongoSanitize());

//Preventing Parameter Pollution
app.use(
  hpp({
    whitelist: [],
  })
);

app.use((req, res, next) => {
  // console.log(req.headers);
  next();
});

app.use("/api/v1/applications", applicationRouter);
app.use("/api/v1/users", userRouter);

app.all("/{*any}", (req, res, next) => {
  const err = new CustomError(
    `Can't find the page with the url ${req.originalUrl}`,
    404
  );
  next(err);
});

app.use(globalErrorHandler);

module.exports = app;
