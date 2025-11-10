const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/advertisements', require('./routes/advertisements'));
app.use('/api/admin', require('./routes/admin'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'SpaLux API is running',
    timestamp: new Date().toISOString()
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!'
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 SpaLux Backend Server running on port ${PORT}`);
  console.log(`📱 API URL: http://localhost:${PORT}`);
});

module.exports = app;
