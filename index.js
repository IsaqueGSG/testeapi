const express = require('express');
const app = express();
const { Client } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const qrcode = require('qrcode');  // Importa a biblioteca QRCode

let qr_generated;
let client;

// Middleware para lidar com dados JSON no corpo da requisição
app.use(express.json());

async function startWhatsappClient() {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: await chromium.executablePath,
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
    });

    client = new Client({
      puppeteer: { browser }
    });

    client.on("qr", (qr) => {
      qr_generated = { qr, dataQrCodeGerado: new Date() };
      console.log("");
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

// Rota para obter o QR Code
app.get('/get-qr-code', async (req, res) => {
  if (!qr_generated || !qr_generated.qr) {
    return res.json({ message: "Tente em alguns segundos, QR Code ainda não está pronto." });
  }

  qrcode.toDataURL(qr_generated.qr, (err, url) => {
    if (err) {
      console.error('Erro ao gerar QR Code:', err);
      res.status(500).json({ error: "Erro ao gerar QR Code." });
    } else {
      res.status(200).json({ qrCode: url, status: false, dataQrCodeGerado: qr_generated.dataQrCodeGerado });
    }
  });
});

// Rota para enviar uma mensagem
app.post('/send-message', async (req, res) => {
  const { N_celular, mensagem } = req.body;
  if (!N_celular || !mensagem) {
    return res.status(400).json({ error: "Número de telefone e mensagem são obrigatórios." });
  }

  try {
    const result = await client.sendMessage(`55${N_celular}@c.us`, mensagem);
    return res.status(200).json({ result });
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    return res.status(500).json({ error: "Erro ao enviar mensagem.", details: error.message });
  }
});

// Rota para verificar o status da API
app.get('/', (req, res) => {
  res.send('WhatsApp bot is running!');
});

// Inicia o servidor express
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
