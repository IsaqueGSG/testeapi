const express = require('express');
const app = express();
const { Client } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda'); // Pacote para Chromium otimizado para ambientes serverless

async function startWhatsappClient() {
    try {
        const browser = await puppeteer.launch({
            headless: true,
            executablePath: await chromium.executablePath, // Caminho correto para o Chromium serverless
            args: chromium.args, // Argumentos necessários para o Chromium funcionar no ambiente serverless
            defaultViewport: chromium.defaultViewport, // Definir o viewport
        });

        const client = new Client({
            puppeteer: { browser }
        });

        client.on('qr', (qr) => {
            console.log('QR Code:', qr);
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
    } catch (error) {
        console.error('Error starting WhatsApp client:', error);
    }
}

// Inicia o cliente
startWhatsappClient();

// Rota para verificar o status da API
app.get('/', (req, res) => {
    res.send('WhatsApp bot is running!');
});

// Inicia o servidor express
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
