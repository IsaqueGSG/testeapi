const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const express = require('express');

const app = express();
const client = new Client({
    puppeteer: {
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
        headless: true,
    },
    
});

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
});

client.on('ready', () => {
    console.log('WhatsApp Web client is ready!');
});

client.on('message', async (msg) => {
    console.log(`Received message: ${msg.body}`);
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
});

client.initialize();

app.get('/', (req, res) => {
    res.send('WhatsApp bot is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
