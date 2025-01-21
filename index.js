const express = require('express');
const app = express();

const { Client } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-core');

// Função que inicializa o cliente do WhatsApp Web
async function startWhatsappClient() {
    const browser = await puppeteer.launch({
        headless: true, // Rodar sem interface gráfica
        executablePath: '/usr/bin/chromium-browser', // Caminho do Chromium em ambientes serverless (ajuste conforme necessário)
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
        ],
    });

    const client = new Client({
        puppeteer: { 
            browser: browser,
        }
    });

    client.on('qr', (qr) => {
        console.log('QR Code:', qr); // Exibir o QR Code no log para escanear
    });

    client.on('ready', () => {
        console.log('WhatsApp is ready!');
    });

    client.on('message', (message) => {
        console.log('Received message:', message.body);
        if (message.body === 'ping') {
            message.reply('pong');
        }
    });

    await client.initialize();
}

// Inicia o cliente
startWhatsappClient().catch((error) => {
    console.error('Error starting WhatsApp client:', error);
});


app.get('/', (req, res) => {
    res.send('WhatsApp bot is running!');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
