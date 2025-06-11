const express = require('express');
const router = express.Router();
router.post('/predict', (req, res) => {
    const { suhu } = req.body;

    if (typeof suhu !== 'number') {
        return res.status(400).json({ error: 'Invalid suhu input, must be a number' });
    }

    const result = (suhu * 1.5 + 10).toFixed(2);
    res.json({ result });
});

module.exports = router;
