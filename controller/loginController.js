const createHttpError = require("http-errors");
const Register = require("../modal/registerModal");
const { sendOtpVerifyMail } = require("../utility/otpmail");
const otpGenerator = require('otp-generator');

const otpStore = new Map();

// Generate OTP
function generateOtp() {
  return otpGenerator.generate(4, { upperCaseAlphabets: false,lowerCaseAlphabets :false ,  specialChars: false });
   //digits default true, remaining ill made to false 
}


const forgotPasswordController = async (req, res, next) => {
  try {
    const { email } = req.body;
    const existEmail = await Register.findOne({ email: email });
    console.log("email", email)
    console.log("existEmail" , existEmail);
    if (!existEmail) {
      return next(createHttpError(404, `given ${email} is not found`));
    }

    const existingEntry = otpStore.get(email);

    // Check if the email is throttled
    if (existingEntry && (Date.now() - existingEntry.timestamp) < 30000) {
      return res.status(429).json({ 
        error: 'Too many requests. Please wait 30 seconds before requesting a new OTP.' 
      });
    }
  
    const otp = generateOtp();
    otpStore.set(email, { otp, timestamp: Date.now() }); // Save OTP with timestamp
  
    console.log(`Generated OTP for ${email}: ${otp}`); // For debugging

    


    const emailSent = await sendOtpVerifyMail(email, email , otp); // 2 arguments is name as of now i use email 
    if (emailSent) {
          // Clear OTP after 5 minutes
      setTimeout(() => otpStore.delete(email), 300000);
      return res.status(200).json({ message: 'User authenticated' }); 
    } 
    else {
      setTimeout(() => otpStore.delete(email), 9000);
      return res.status(500).json({ message: "Login successful, but email failed to send" });
    }
    // res.status(200).json({message : "please change the password" , status : true})
  } catch (err) {
    return next(createHttpError(500, `Error occurs`));
  }
};

const verifyEmailPasswordController = async(req,res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedData = otpStore.get(email);

  if (storedData && storedData.otp === otp) {
    otpStore.delete(email); // Clear OTP after verification
    return res.status(200).json({ message: 'OTP verified successfully' });
  }

  res.status(400).json({ error: 'Invalid or expired OTP' });
}

module.exports = {
  forgotPasswordController,
  verifyEmailPasswordController
};
