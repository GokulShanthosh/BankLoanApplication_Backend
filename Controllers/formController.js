const Form = require("./../Models/formModel");
const CustomError = require("../Utils/CustomError");
const AsynHandler = require("../Utils/catchAsync");
const ApiFeatures = require("../Utils/apiFeatures");

exports.createNewForm = AsynHandler(async (req, res, next) => {
  // Handle file uploads
  const files = req.files;
  if (!files?.incomeProof) {
    return next(new CustomError("Income proof document is required", 400));
  }

  const formData = {
    ...req.body,
    incomeProof: files.incomeProof[0].path,
    collateralDocument: files.collateralDocument?.[0]?.path || null
  };

  // Add user email if available
  if (req.user?.email) {
    formData.emailId = req.user.email;
  }

  const form = await Form.create(formData);

  res.status(201).json({
    status: "success",
    data: {
      form
    }
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
  console.log("hi");
  
  const loginForms = await Form.find({ emailId: req.user.email });
  console.log(loginForms);
  
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
