require('dotenv').config(); // Load environment variables
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
require('dotenv').config()

app.use(bodyParser.json());
app.use(cookieParser());



const allowedOrigins = ['http://localhost:3001', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
}));

const port = process.env.SERVER_URL || 4000;


const ACCESS_TOKEN_SECRET = 'sdfndvfksjdfblsdkjfhs;dfkj2376vsj#45#$@%';
const REFRESH_TOKEN_SECRET =  'LKDLMNJIEWGDBjhacvkdsj%#*^%*^%jh223fv';
let refreshTokens = []; // Store valid refresh tokens (in-memory for now)

// Generate tokens
function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '1m' });
}

function generateRefreshToken(user) {
  const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: '2m' });
  refreshTokens.push(refreshToken);
  return refreshToken;
}

// Login endpoint
app.post('/login', (req, res) => {
  console.log("lof=gin area");
  const { username } = req.body;
  if (!username) return res.status(400).send('Username is required');

  const user = { name: username };
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  console.log("username", req.body , accessToken , "refresh", refreshToken);


  res.json({ accessToken , refreshToken });
});

// Refresh token endpoint
app.post('/refresh', (req, res) => {
  
  const refreshToken = req.cookies.refreshToken;
  console.log("refresh area",refreshToken);
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token not found' });
  if (!refreshTokens.includes(refreshToken)) return res.status(403).json({ error: 'Invalid refresh token' });
  console.log("both condition solved success");

  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token verification failed' });
    console.log("user.name", user.name);
    const newAccessToken = generateAccessToken({ name: user.name });
    console.log("accessToken", newAccessToken);
    res.json({ accessToken: newAccessToken });
  });
});

// Protected route
app.get('/protected', (req, res) => {
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(401); // why i need to change 403 to 401 status code , because infront it assign with 401
    res.json({ message: `Hello, ${user.name}. You have access.` });
  });
});

app.get('/dashboard', (req, res) => {
  
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(401);
    res.json({ message: `Hello, ${user.name}. You have access.` });
  });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.clearCookie('refreshToken');
  res.sendStatus(204);
});

// Start server
app.listen(port ,()=>{
  console.log(`port is running on ${port} successfcully`);
})
