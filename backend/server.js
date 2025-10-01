// Dependencies and environment variables
require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const { validate } = require('./middlewares/validate');
const { submitScoreSchema } = require('./validators');
const SECRET_KEY = process.env.JWT_SECRET;
const app = express();
const rateLimit = require('express-rate-limit');
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());

// Rate Limiting para evitar abuso nos endpoints
const scoreLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, 		// 10 minutos
  max: 100, 						// limite de 100 requests por IP por janela
  standardHeaders: true,			// inlcui os headers RateLimit
  legacyHeaders: false,				// desativa os headers X-RateLimit
  keyGenerator: (req) => req.ip 	// usa o IP do cliente como chave
});

// Limitar uso de endpoints sensíveis

app.use('/submit_score', scoreLimiter); 
app.use('/get_top_scores', scoreLimiter);


// Inicialização do servidor
async function startServer() {
	try {
	  await mongoose.connect(process.env.MONGODB_URI);
	  console.log("Conectado ao MongoDB Atlas");
  
	  app.listen(process.env.PORT || 5001, () => {
		console.log(`Servidor a correr na porta ${process.env.PORT || 5001}`);
	  });
	} catch (err) {
	  console.error("Erro ao conectar ao MongoDB Atlas", err);
	  process.exit(1); 
	}
  }
  
  startServer();

// Definição do modelo Score
const scoreSchema = new mongoose.Schema({
  player: { type: String, required: true, trim: true },
  score: { type: Number, required: true, min: 0 },
  difficulty: { type: Number, required: true, enum: [1, 2, 3] },
  time: { type: Number, required: true, min: 0 },
  submittedAt: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', scoreSchema);

// Definição do modelo Challenge
const challengeSchema = new mongoose.Schema({
  difficulty: Number,
  startNumber: Number,
  targetNumber: Number,
  date: { type: Date, default: Date.now }
});
const Challenge = mongoose.model('Challenge', challengeSchema);

// Mapa de sessões ativas (tokens gerados para cada jogo iniciado)
const activeSessions = new Map();

// Gerar um Token JWT ao Iniciar o Jogo
app.post('/start_game', (req, res) => {
	try{
		let clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
		if (clientIP.includes(',')) clientIP = clientIP.split(',')[0].trim();
		if (clientIP.startsWith('::ffff:')) clientIP = clientIP.substring(7);

		const sessionHash = CryptoJS.HmacSHA256(`${clientIP}:${Date.now()}`, SECRET_KEY).toString();
		const tokenPayload = { ip: clientIP, startTime: Date.now(), sessionHash };
		const token = jwt.sign(tokenPayload, SECRET_KEY, { expiresIn: '1h' });

		activeSessions.set(sessionHash, { ip: clientIP, startTime: Date.now() });

		//console.log(`Novo jogo iniciado! Token gerado: ${token} | IP: ${clientIP}`);
		res.json({ token, sessionHash });
	} catch(e){
		console.error("Erro no /start_game :", e);
		return res.status(500).json({ error: 'Não foi possível iniciar sessão de jogo' });
	}
});

// Endpoint para obter ou criar um desafio
app.get('/get_challenge', async (req, res) => {
	console.log("Endpoint /get_challenge foi chamado!");
	
	const difficulty = parseInt(req.query.difficulty);
	if (isNaN(difficulty)) {
	  return res.status(400).json({ error: 'Dificuldade inválida' });
	}
  
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	
	console.log(`A procura de desafio para dificuldade ${difficulty} na data ${today}`);
  
	try {
	  let challenge = await Challenge.findOne({ difficulty: difficulty, date: today }); // procura desafio do dia com a dificuldade desejada
  
	  if (!challenge) { // se não houver desafio, cria um novo
		console.log("Nenhum desafio encontrado, criando um novo.");
		const range = difficulty === 1 ? 100 : difficulty === 2 ? 1000 : 10000;
		const startNumber = Math.floor(Math.random() * range) + 1;
		const targetNumber = Math.floor(Math.random() * range) + 1;
  
		challenge = new Challenge({ difficulty, startNumber, targetNumber, date: today }); // novo desafio
		await challenge.save(); // guardad na BD
	  }
	  
	  res.json([challenge.startNumber, challenge.targetNumber]);
	} catch (error) {
	  console.error('Erro ao buscar/criar desafio:', error);
	  res.status(500).json({ error: 'Erro ao buscar desafio' });
	}
  });

// Enviar Score com Token e Verificação de Hash
app.post('/submit_score', validate(submitScoreSchema), async (req, res) => {
	const { username, difficulty, score, time, sessionHash } = req.validated;
	const token = req.headers.authorization?.split(" ")[1];
  
	if (!token) {
	  return res.status(403).json({ error: 'Token ausente. Sessão inválida!' });
	}
  
	try {
	  const decoded = jwt.verify(token, SECRET_KEY);
	  let clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
	  if (clientIP.includes(',')) clientIP = clientIP.split(',')[0].trim();
	  if (clientIP.startsWith('::ffff:')) clientIP = clientIP.substring(7);
  
	  console.log(`Tentativa de submit_score | IP: ${clientIP} | Usuário: ${username}`);
  
	  if (decoded.ip !== clientIP) {
		return res.status(403).json({ error: 'IP diferente do início do jogo!' });
	  }
  
	  if (!activeSessions.has(sessionHash) || activeSessions.get(sessionHash).ip !== clientIP) {
		return res.status(403).json({ error: 'Sessão inválida. Jogo não autorizado!' });
	  }

	  activeSessions.delete(sessionHash);

	  const newScore = new Score({ player: username, score, time, difficulty });
	  await newScore.save();
	  res.json({ message: 'Score salvo com sucesso!' });
  
	} catch (error) {
	  console.error('Erro na verificação do token:', error);
	  return res.status(403).json({ error: 'Token inválido ou expirado.' });
	}
	console.log(`Jogo salvo com ${score} | user: ${username}`);
  });

// Buscar Scores do Dia Atual
app.get('/get_top_scores', async (req, res) => {
  const difficulty = parseInt(req.query.difficulty);
  if (isNaN(difficulty)) {
    return res.status(400).json({ error: 'Dificuldade inválida' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  try {
    const scores = await Score.find({
      difficulty,
      submittedAt: { $gte: today, $lt: tomorrow }
    })
      .sort({ score: 1, time: 1 })
      .limit(5);

    res.json({ scores });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar scores' });
  } 
});

/*
app.delete('/delete_today_scores', async (req, res) => {
	try {
	  // Definir o intervalo do dia atual
	  const today = new Date();
	  today.setHours(0, 0, 0, 0); // Início do dia
	  const tomorrow = new Date(today);
	  tomorrow.setDate(today.getDate() + 1); // Início do próximo dia
  
	  // Apagar os scores do dia atual
	  const result = await Score.deleteMany({
		submittedAt: { $gte: today, $lt: tomorrow },
	  });
  
	  res.json({ message: `${result.deletedCount} scores do dia atual foram apagados.` });
	} catch (error) {
	  console.error('Erro ao apagar scores:', error);
	  res.status(500).json({ error: 'Erro ao apagar scores' });
	}
  });

  */