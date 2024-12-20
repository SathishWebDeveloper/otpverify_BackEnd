const express = require('express');
const route = express.Router();
const forgotPassController = require('../controller/loginController');


route.post('/',forgotPassController.forgotPasswordController);

route.post('/verify', forgotPassController.verifyEmailPasswordController )



module.exports = route;
