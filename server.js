app.post('/proxy', async (req, res) => {
  try {
    // VERIFICAÇÃO DO TIMESTAMP
    const authHeader = req.headers.authorization;
    const timestamp = authHeader.match(/Timestamp=(\d+)/)[1];
    const now = Date.now();
    const diff = Math.abs(now - parseInt(timestamp));
    
    if (diff > 300000) { // 5 minutos de tolerância
      console.warn(`AVISO: Timestamp com diferença de ${diff/1000}s`);
    }
    
    
    
    const express = require('express');
const axios = require('axios');
const app = express();

process.env.TZ = 'America/Sao_Paulo';

app.use(express.json());

// Middleware de log melhorado
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requisição de ${req.ip}`, {
    headers: req.headers,
    body: req.body
  });
  next();
});

// Rota principal com tratamento robusto
app.post('/proxy', async (req, res) => {
  try {
    console.log("Enviando para Shopee:", req.body);
    
    const response = await axios.post('https://open-api.affiliate.shopee.com.br/graphql', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'X-APP-ID': req.headers['x-app-id']
      },
      timeout: 8000
    });
    
    console.log("Resposta da Shopee:", response.data);
    res.json(response.data);
    
  } catch (error) {
    console.error("ERRO DETALHADO:", {
      message: error.message,
      response: error.response?.data,
      stack: error.stack
    });
    res.status(500).json({ 
      error: "Erro na API Shopee",
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🟢 Proxy ativo na porta ${PORT} | ${new Date()}`));


      // Restante do seu código...
  } catch (error) {
    console.error("ERRO DETALHADO:", {
      timestampReceived: timestamp,
      serverTime: now,
      timeDifference: diff
    });
    //...
  }
});
