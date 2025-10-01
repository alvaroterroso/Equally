# Equally — Math Puzzle Game

Mini-jogo diário de matemática: usa os números disponíveis e operações básicas para atingir o objetivo.

## Stack
- Frontend: React (Vite/CRA), CSS
- Backend: Node.js + Express, Zod
- Deploy: Render (backend) + Vercel (frontend)

## Como correr localmente
```bash
# Backend
cd backend
npm ci
cp .env.example .env   # preenche as variáveis
npm run dev

# Frontend
cd ../frontend
npm ci
npm start
