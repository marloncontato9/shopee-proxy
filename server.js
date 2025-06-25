// server.js
const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// Rota segura para a API Shopee
app.post('/proxy', async (req, res) => {
  try {
    const response = await axios.post('https://open-api.affiliate.shopee.com.br/graphql', req.body, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
        'X-APP-ID': req.headers['x-app-id']
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Erro na conexão com a Shopee" });
  }
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy Shopee rodando!`));
