// validators.js
const { z } = require('zod');

const submitScoreSchema = z.object({
  username: z.string().trim().min(3).max(16).regex(/^[a-zA-Z0-9_]+$/),
  difficulty: z.number().int().refine(v => [1, 2, 3].includes(v)),
  score: z.number().int().min(0).max(1_000),       // limite configurável
  time: z.number().int().min(0).max(60 * 60 * 1000),   // máx 1h em ms
  sessionHash: z.string().length(64).regex(/^[a-f0-9]+$/),
  // challengeId ainda não usas no teu código atual, mas já deixo aqui preparado
  challengeId: z.string().length(24).regex(/^[a-f0-9]+$/).optional()
});

module.exports = { submitScoreSchema };
