const express = require('express');
const app = express();
const { Client } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');
const qrcode = require('qrcode'); // Importa a biblioteca QRCode

app.use(express.json());

let qr_generated = null;
let client = null;

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

    client.on('qr', async (qr) => {
      try {
        const qrCodeUrl = await qrcode.toDataURL(qr);
        qr_generated = { qrCode: qrCodeUrl, status: false, dataQrCodeGerado: new Date() };
        console.log('QR Code gerado com sucesso!');
      } catch (err) {
        console.error('Erro ao gerar QR Code:', err);
      }
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
    console.error('Erro ao inicializar cliente:', error);
  }
}

startWhatsappClient();

// Rota para obter o QR Code
app.get('/get-qr-code', async (req, res) => {
  if (!qr_generated || !qr_generated.qrCode) {
    return res.status(404).json({ message: 'QR Code ainda não está pronto. Tente novamente mais tarde.' });
  }

  res.status(200).json(qr_generated);
});

// Rota para enviar uma mensagem
app.post('/send-message', async (req, res) => {
  try {
    if (!client) {
      return res.status(503).json({ error: 'Cliente do WhatsApp ainda não está pronto.' });
    }

    const { N_celular, mensagem } = req.body;

    if (!N_celular || !mensagem) {
      return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios.' });
    }

    const response = await client.sendMessage(`55${N_celular}@c.us`, mensagem);
    res.status(200).json({ message: 'Mensagem enviada com sucesso!', response });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// Rota para verificar o status da API
app.get('/', (req, res) => {
  res.send('WhatsApp bot is running!');
});

// Inicia o servidor express
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
