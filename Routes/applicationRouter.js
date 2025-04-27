const authController = require("./../Controllers/authController");
const userController = require("./../Controllers/userController");
const formController = require("./../Controllers/formController");
const express = require("express");

const router = express.Router(); //returns a middleware

router
  .route("/")
  .post(authController.protect, formController.createNewForm)
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    formController.getAllForms
  );

router.get(
  "/get-login-forms",
  authController.protect,
  formController.getLoginForms
);

router.patch(
  "/approve-reject-loan",
  authController.protect,
  authController.restrictTo("admin"),
  formController.approveOrRejectLoan
);

router.delete(
  "/with-draw-application",
  authController.protect,
  formController.withDrawApplication
);
module.exports = router;
