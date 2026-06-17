const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const XV_API = "https://arslan-apis-v2.vercel.app";

async function tryRequest(fn, tries = 3) {
    let err;
    for (let i = 1; i <= tries; i++) {
        try { return await fn(); } 
        catch (e) {
            err = e;
            await new Promise(r => setTimeout(r, i * 1000));
        }
    }
    throw err;
}

app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q;
        const response = await tryRequest(() => axios.get(`${XV_API}/download/xvideosSearch?text=${encodeURIComponent(query)}`, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'application/json' }
        }));
        res.json(response.data);
    } catch (error) {
        console.error("Proxy Search Error:", error.message);
        res.status(500).json({ status: false, message: "API Search Failed" });
    }
});

app.get('/api/download', async (req, res) => {
    try {
        const videoUrl = req.query.url;
        const response = await tryRequest(() => axios.get(`${XV_API}/download/xvideosDown?url=${encodeURIComponent(videoUrl)}`, {
            timeout: 30000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Accept': 'application/json' }
        }));
        res.json(response.data);
    } catch (error) {
        console.error("Proxy Download Error:", error.message);
        res.status(500).json({ status: false, message: "API Download Failed" });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 QADEER-AI Vault v6 Realtime Running on Port ${PORT}`);
});
