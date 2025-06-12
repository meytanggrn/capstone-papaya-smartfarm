require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const authRouter = require('./auth');
const dashboardRouter = require('./dashboard');
const lahanRouter = require('./lahan');
const path = require('path');
const mqtt = require('mqtt');
const app = express();
const prediksiRoutes = require('./routes/prediksi');
const diseasesRouter = require('./routes/diseases');
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

const server = http.createServer(app);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/lahan', lahanRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', diseasesRouter);
app.use('/model', express.static(path.join(__dirname, 'public/model')));
app.use('/api/prediksi', prediksiRoutes);

const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

const mqttClient = mqtt.connect('mqtt://broker.hivemq.com:1883');
mqttClient.on('connect', () => {
    console.log('MQTT connected');
    mqttClient.subscribe('SMART-FARM/#');
});
mqttClient.on('message', async (topic, message) => {
    const payload = message.toString();
    if (topic === 'SMART-FARM/data') {
        let data = [];
        try { data = JSON.parse(payload); } catch { }
        try {
            await pool.query(
                'INSERT INTO sensor_data (humidity, temperature, cahaya, kelembaban_tanah) VALUES ($1,$2,$3,$4)',
                [data.humidity, data.temperature, data.cahaya, data.kelembaban_tanah]
            );
        } catch (e) {
            console.error('Gagal simpan ke database:', e);
        }

        io.emit('sensor-update', data);
    } else if (
        topic === 'SMART-FARM/hum' ||
        topic === 'SMART-FARM/temp' ||
        topic === 'SMART-FARM/chy' ||
        topic === 'SMART-FARM/kbtn'
    ) {
        io.emit('sensor-single', { topic, value: payload });
    }
});

app.get('/api/sensor/histori', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT * FROM sensor_data ORDER BY waktu DESC LIMIT 10'
        );
        res.json(rows.reverse()); // urut lama ke baru
    } catch (e) {
        res.status(500).json({ error: 'Gagal ambil data' });
    }
});

app.get('/api/ping', (req, res) => res.json({ msg: 'Server OK!' }));
server.listen(5000, () => console.log('Server running on port 5000'));
