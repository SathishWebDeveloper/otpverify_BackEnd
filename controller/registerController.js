const Register = require("../modal/registerModal");
const createError = require("http-errors");

const bcrypt = require("bcrypt");
const saltRounds = 10;
const saveRegisterData = async(req,res,next) => {
    try {
        const {  email, password } = req.body;
        console.log("email", email , password)
    
        // Check if email already exists
        const existEmail = await Register.findOne({ email: email });
        console.log('existEmail', existEmail)
        if (existEmail) {
          return next(createError(409, `User ${email} is already registered`));
        }
    
        // Encrypt password using bcrypt
        const encryptedPassword = await bcrypt.hash(password, saltRounds);
    
        //     Technique 2 (auto-gen a salt and hash):
    
        // bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
        //     // Store hash in your password DB.
        // });  handle with the error
    
        // Create a new user with hashed password

        console.log("test" , encryptedPassword)

        const newUser = new Register({
          email,
          password: encryptedPassword, // Store the hashed password
        });
    
        console.log("New User:", newUser);
    
        // Save the user in the database
        const data = await newUser.save();
        res.status(200).json({ message: "User data created successfully" });
      } catch (err) {
        next(createError(500, "Error not saving user data"));
      }

}

module.exports = {
    saveRegisterData
}