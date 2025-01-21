const express = require('express');
const app = express();
const { Client } = require('whatsapp-web.js');
const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda'); // Pacote para Chromium otimizado para ambientes serverless

let qr_generated;



const browser = await puppeteer.launch({
  headless: true,
  executablePath: await chromium.executablePath, // Caminho correto para o Chromium serverless
  args: chromium.args, // Argumentos necessários para o Chromium funcionar no ambiente serverless
  defaultViewport: chromium.defaultViewport, // Definir o viewport
});

const client = new Client({
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

await client.initialize()
  .catch(error => console.error('Error starting WhatsApp client:', error))

router.get('/get-qr-code', async (req, res) => {

  if (!qr_generated.qr) {
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
router.post('/send-message', async (req, res) => {

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
