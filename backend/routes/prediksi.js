const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../db');

const router = express.Router();
app.post('/api/predict', (req, res) => {
    const suhu = req.body.suhu
    // Model dummy: hasil = suhu * 1.5 + 10 (samakan dengan model tfjs)
    const result = (suhu * 1.5 + 10).toFixed(2)
    res.json({ result })
})
