const dotenv = require("dotenv");
const mongoose = require("mongoose");

const app = require("./app");

process.on("uncaughtException", (err) => {
  console.log(err.name, err.message);
  process.exit(1);
});

//Environment Variable Cofiguration
dotenv.config({ path: "./config.env" });

//Setting up mongoose driver for local db
mongoose.connect(process.env.LOCAL_CONN_STR).then((conn) => {
  console.log("DB connection successfull");
});

//Create a server.
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Server Started Successfully at port: ${port}`);
});

// Unhandled async Rejection
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
