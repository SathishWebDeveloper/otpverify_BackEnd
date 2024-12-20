const express = require('express');
const route = express.Router();
const registerController = require('../controller/registerController');

route.post('/',registerController.saveRegisterData ) 



module.exports = route;

