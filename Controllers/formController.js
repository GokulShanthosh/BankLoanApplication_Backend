const Form = require("./../Models/formModel");
const CustomError = require("../Utils/CustomError");
const AsynHandler = require("../Utils/catchAsync");
const ApiFeatures = require("../Utils/apiFeatures");

exports.createNewForm = AsynHandler(async (req, res) => {
  // 1. Generate a unique application ID
  const applicationId = `APP-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)
    .toUpperCase()}`; // Example

  // 2. Create the form with the request body and the application ID
  const form = await Form.create({
    ...req.body,
    applicationId: applicationId, // Store the generated ID
  });

  // 3. (Optional) If you still need to add emailId from req.user:
  if (req.user && req.user.email) {
    form.emailId = req.user.email;
    await form.save(); // Save again to persist the emailId
  }

  // 4. Send the response
  res.status(201).json({
    status: "success",
    data: {
      form, // The form now includes the applicationId
    },
  });
});

exports.getAllForms = AsynHandler(async (req, res) => {
  const features = new ApiFeatures(Form.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .pagination();

  // Execute query
  const forms = await features.query;

  // Send response
  res.status(200).json({
    status: "success",
    results: forms.length,
    data: forms,
  });
});

exports.getLoginForms = AsynHandler(async (req, res) => {
  console.log(req.user.email);

  const loginForms = await Form.find({ emailId: req.user.email });
  
  res.status(200).json({
    status: "success",
    results: loginForms.length,
    data: {
      loginForms,
    },
  });
});

exports.approveOrRejectLoan = AsynHandler(async (req, res) => {
  const { applicationId, status } = req.body; // Extract applicationId and status from req.body

  if (!applicationId || !status) {
    return next(
      CustomError(
        "applicationId and status are required in the request bodyapplicationId and status are required in the request body",
        400
      )
    );
  }

  const updatedForm = await Form.findOneAndUpdate(
    { applicationId: applicationId }, // Use the applicationId to find the correct form
    { status: status }, // Update the status field
    { new: true, runValidators: true } // Options:  return the *new* document, and run schema validators
  );

  if (!updatedForm) {
    return next(CustomError("Form with provided applicationId not found", 400));
  }

  // If the update was successful, send the updated form back
  res.status(200).json({
    status: "success",
    data: {
      updatedForm,
    },
  });
});

exports.withDrawApplication = AsynHandler(async (req, res) => {
  const { applicationId } = req.body; // Extract applicationId from req.body

  if (!applicationId) {
    return next(
      CustomError("applicationId is required in the request body", 400)
    );
  }

  const deletedForm = await Form.findOneAndDelete({
    applicationId: applicationId,
  });

  if (!deletedForm) {
    // Handle the case where no form with that applicationId was found
    return next(CustomError("Form with provided applicationId not found", 400));
  }

  // If the deletion was successful, send a success message
  res.status(200).json({
    status: "success",
    message: "Application withdrawn successfully",
    data: {
      deletedForm, // Optionally send the deleted form data
    },
  });
});
