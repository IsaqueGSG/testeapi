const express = require('express');
const app = express()

const qrcode = require('qrcode');
const qrcodeTerminal = require('qrcode-terminal');
const { Client } = require("whatsapp-web.js");


let qr_generated;
let client;
let status = false;


// Inicializa o cliente WhatsApp com a estratégia de autenticação local
client = new Client({
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  }
});

// QR Code no terminal
client.on("qr", (qr) => {
  qrcodeTerminal.generate(qr, { small: true });
  qr_generated = { qr, dataQrCodeGerado: new Date() };
  console.log("QR Code front-end pronto.");
});

client.on('ready', () => {
  console.log('Cliente WhatsApp pronto');
  status = true;
});

client.on("disconnected", (reason) => {
  console.log(`Cliente desconectado: ${reason}`);
  status = false;
});

// Verifica se já existe uma sessão armazenada
try {
  client.initialize();
} catch (error) {
  console.log("Erro ao tentar restaurar a sessão:", error);
  return null; // Caso não consiga restaurar a sessão, retorna null
}



// Rota para retornar o QR Code
app.get('/get-qr-code', async (req, res) => {

  if (status) {
    return res.json({ message: "voce já esta conectado!" });
  }

  if (!qr_generated.qr) {
    return res.json({ message: "Tente em alguns segundos, QR Code ainda não está pronto." })
  }

  qrcode.toDataURL(qr_generated.qr, (err, url) => {
    if (err) {
      console.error('Erro ao gerar QR Code:', err);
      res.status(500).json({ error: "Erro ao gerar QR Code." });
    } else {
      res.status(200).json({ qrCode: url, status, dataQrCodeGerado: qr_generated.dataQrCodeGerado });
    }
  });
});

// Rota para enviar uma mensagem
app.post('/send-message', async (req, res) => {

  if (!status) {
    return res.status(400).json({ error: "Nenhuma conexão ativa com o WhatsApp." });
  }

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

app.get('/status-whatsapp', async (req, res) => {
  res.json({ status })
});



app.get("/", (req, res) => {
  return res.send("ola")
})

const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});