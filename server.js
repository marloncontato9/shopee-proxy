const express = require('express');
const axios = require('axios');
const app = express();

// 1. Configuração do timezone
process.env.TZ = 'America/Sao_Paulo';

// 2. Middlewares
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requisição de ${req.ip}`, {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  next();
});

// 3. Rota principal
app.post('/proxy', async (req, res) => {
  try {
    // Verificação do timestamp
    const authHeader = req.headers.authorization || '';
    const timestampMatch = authHeader.match(/Timestamp=(\d+)/);
    
    if (!timestampMatch) {
      return res.status(400).json({ error: "Cabeçalho Authorization inválido" });
    }

    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const diff = Math.abs(now - timestamp);

    // Log de verificação
    console.log("Verificação do timestamp:", {
      recebido: new Date(timestamp).toISOString(),
      servidor: new Date(now).toISOString(),
      diferença_ms: diff
    });

    // Requisição para a API Shopee
    const shopeeResponse = await axios.post(
      'https://open-api.affiliate.shopee.com.br/graphql',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization,
          'X-APP-ID': req.headers['x-app-id']
        },
        timeout: 8000
      }
    );

    res.json(shopeeResponse.data);

  } catch (error) {
    console.error("Erro completo:", {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    res.status(500).json({ 
      error: "Erro no proxy",
      details: error.message 
    });
  }
});

// 4. Inicialização do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Proxy Shopee rodando na porta ${PORT}`);
  console.log(`🕒 Timezone: ${process.env.TZ}`);
  console.log(`⚙️ Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
