const express = require('express');
const axios = require('axios');
const app = express();

// 1. Configuração do timezone
process.env.TZ = 'America/Sao_Paulo';

// 2. Middlewares
app.use(express.json());

// Middleware de logs (filtra dados sensíveis)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Requisição de ${req.ip}`, {
    method: req.method,
    path: req.path,
    headers: {
      ...req.headers,
      authorization: req.headers.authorization ? '***REDACTED***' : undefined,
      'x-proxy-password': '***REDACTED***'
    },
    body: req.body // Cuidado com dados sensíveis no body!
  });
  next();
});

// 3. Rota de health check e teste de conexão
app.get('/', async (req, res) => {
  try {
    const serverStatus = {
      status: 'online',
      port: process.env.PORT || 10000,
      timestamp: new Date().toISOString(),
    };

    // Gera um timestamp VÁLIDO para a Shopee (timestamp atual em segundos)
    const timestamp = Math.floor(Date.now() / 1000);

    // Envia uma query SIMPLES (ex: listar categorias)
    const shopeeTest = await axios.post(
      'https://open-api.affiliate.shopee.com.br/graphql',
      { query: '{ products { id } }' }, // Query de teste
      {
        headers: {
          'Content-Type': 'application/json',
          'X-APP-ID': process.env.SHOPEE_API_ID,
          'Authorization': `SHA256 Credential=${process.env.SHOPEE_API_ID}, Timestamp=${timestamp}`,
        },
        timeout: 5000,
      }
    );

    res.json({
      ...serverStatus,
      shopee_api: 'connected',
      shopee_response: shopeeTest.data, // Mostra a resposta real
    });

  } catch (error) {
    res.json({
      ...serverStatus,
      shopee_api: 'error',
      error: error.message,
      details: error.response?.data || 'Sem resposta da Shopee',
    });
  }
});

// 4. Rota principal do proxy
app.post('/proxy', async (req, res) => {
  try {
    // Validação opcional de senha (se PROXY_PASSWORD estiver definido)
    if (process.env.PROXY_PASSWORD) {
      const proxyPassword = req.headers['x-proxy-password'];
      if (proxyPassword !== process.env.PROXY_PASSWORD) {
        return res.status(401).json({ error: "Acesso não autorizado" });
      }
    }

    // Verificação do timestamp (exemplo)
    const authHeader = req.headers.authorization || '';
    const timestampMatch = authHeader.match(/Timestamp=(\d+)/);
    if (!timestampMatch) {
      return res.status(400).json({ error: "Cabeçalho Authorization inválido" });
    }

    const timestamp = parseInt(timestampMatch[1]);
    const now = Date.now();
    const diff = Math.abs(now - timestamp);
    const MAX_TIME_DIFF = 5 * 60 * 1000; // 5 minutos

    if (diff > MAX_TIME_DIFF) {
      return res.status(400).json({ error: "Timestamp expirado" });
    }

    // Requisição para a API Shopee
    const shopeeResponse = await axios.post(
      'https://open-api.affiliate.shopee.com.br/graphql',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': req.headers.authorization,
          'X-APP-ID': process.env.SHOPEE_API_ID,
          'X-SECRET': process.env.SHOPEE_API_SECRET // Se necessário
        },
        timeout: 8000
      }
    );

    res.json(shopeeResponse.data);

  } catch (error) {
    console.error("Erro no proxy:", {
      message: error.message,
      code: error.code,
      url: error.config?.url
    });

    const statusCode = error.code === 'ECONNABORTED' ? 504 : 500;
    res.status(statusCode).json({ 
      error: "Erro no proxy",
      details: error.message 
    });
  }
});

// 5. Inicialização do servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🟢 Proxy Shopee rodando na porta ${PORT}`);
  console.log(`🕒 Timezone: ${process.env.TZ}`);
  console.log(`⚙️ Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Variáveis de ambiente carregadas: ${process.env.SHOPEE_API_ID ? 'SIM' : 'NÃO'}`);
});
