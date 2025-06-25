// server.js
const express = require('express');
const axios = require('axios');
const app = express();

// Configura timezone BR
process.env.TZ = 'America/Sao_Paulo';

// Middleware para logs detalhados
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Nova requisição de ${req.ip}`);
  next();
});

// Rota principal
app.post('/proxy', async (req, res) => {
  try {
    const response = await axios.post('https://open-api.affiliate.shopee.com.br/graphql', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'X-APP-ID': req.headers['x-app-id']
      },
      timeout: 5000 // 5 segundos de timeout
    });
    res.json(response.data);
  } catch (error) {
    console.error("ERRO:", error.message);
    res.status(500).json({ error: "Erro na conexão com a Shopee" });
  }
});

// Mantém serviço ativo (ping a cada 5 min)
setInterval(() => axios.get(process.env.RENDER_EXTERNAL_URL).catch(() => {}), 300000);

// Inicia servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Proxy Shopee rodando na porta ${PORT} | Timezone: ${process.env.TZ}`));
