require("dotenv").config();
const { sendRegistrationEmail } = require("./src/services/emailService.js");

const test = async () => {
  console.log("=== Testing Real SMTP Delivery ===");
  await sendRegistrationEmail("adiraj242004@gmail.com", "Aditya", "customer");
  console.log("=== Test Completed ===");
};

test().catch(console.error);
