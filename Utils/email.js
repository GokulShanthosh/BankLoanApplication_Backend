const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true, // Use SSL
      host: "smtp.gmail.com", // Corrected host
      port: 587, // Corrected port for TLS
      auth: {
        user: process.env.MY_GMAIL, // Ensure these are set correctly in your environment
        pass: process.env.MY_GMAIL_KEY,
      },
    });

    // 2. Define email options
    const mailOptions = {
      from: process.env.MY_GMAIL, // Use your email here
      to: options.email, // Use the recipient's email
      subject: options.subject,
      text: options.message,
    };

    // 3. Actually send the email
    const info = await transporter.sendMail(mailOptions); // Await the promise
    console.log("Email sent successfully:", info.response); // Log the response
  } catch (error) {
    console.error("Error sending email:", error); // Log the error
    throw error;
  }
};

module.exports = sendEmail;
