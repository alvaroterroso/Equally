import { useEffect, useMemo, useRef, useState } from "react";

const apiUrl = process.env.REACT_APP_API_URL;

// funcoes de validacao 
const isDigits = (s) => /^\d+$/.test(s);
const isOp = (s) => /^[+\-*/]$/.test(s);

export default function useGameLogic() {
  // === estado principal do jogo ===
  const [difficulty, setDifficulty] = useState(1); // 1 = "easy" | 2 = "medium" | 3 = "hard"
  const [goalNumber, setGoalNumber] = useState(null);    // goal
  const [availableNumbers, setAvailableNumbers] = useState([]); // inclui o start e os resultados
  const [stepCount, setStepCount] = useState(0); // número de opereações feitas

  // inputs da expressão
  const [leftValue, setLeftValue] = useState(""); 
  const [operator, setOperator] = useState("");
  const [rightValue, setRightValue] = useState("");

  // UI auxiliares
  const [loading, setLoading] = useState(true); // se verdade mostrar text de "loading"
  const [resultMessage, setResultMessage] = useState(""); // resultado da operacao atual

  // Opcoes do menu e username input afte win
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  // tempo
  const [startTime, setStartTime] = useState(null); // timestamp para bd
  const [elapsedTime, setElapsedTime] = useState(0); // elapsed time para bd

  // refs (se user quiser navegar com setas) -  não implementado ainda
  const leftRef = useRef(null);
  const opRef = useRef(null);
  const rightRef = useRef(null);

  // validação do input atual
  const isValid = useMemo(() => { // useMemo para evitar confirmarmos a mesmo operação várias vezes
    if (!leftValue || !operator || !rightValue) return false;
    return isDigits(leftValue) && isOp(operator) && isDigits(rightValue); // confirmar input
  }, [leftValue, operator, rightValue]);

  // ------ Fetch do challenge sempre que a difficuldade mude -----
  useEffect(() => {

    async function loadChallenge() {
      setLoading(true);

      // reset de estado quando muda dificuldade
      setShowUsernameInput(false);
      setResultMessage("");
      setStepCount(0);
      setLeftValue("");
      setOperator("");
      setRightValue("");
      setGoalNumber(null);
      setAvailableNumbers([]);

      try { // fetch do challenge
        const res = await fetch(`${apiUrl}/get_challenge?difficulty=${difficulty}`); // get do challenge com dificuldade (await para esperar o peidido http estar feito)
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text(); // parse to text
        const data = JSON.parse(text); // parse to json data

        // esperado: [startNumber, targetNumber]
        if (Array.isArray(data) && data.length === 2) {
          const [startNumber, targetNumber] = data;
          setAvailableNumbers([startNumber]);
          setGoalNumber(targetNumber);
          const now = Date.now();
          setStartTime(now);
          localStorage.setItem("gameStartTime", String(now)); // caso o UsernameInput ainda leia do localStorage
        } else {
          console.error("Formato inesperado em /get_challenge:", data);
        }
      } catch (e) {
        console.error("Erro a carregar desafio:", e);
      } finally {
		setLoading(false);
      }
    }

    loadChallenge();

    // bloquear scroll das setas
    const preventArrowKeyScroll = (e) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", preventArrowKeyScroll);

    return () => {
      window.removeEventListener("keydown", preventArrowKeyScroll);
    };
  }, [difficulty]); // dispara quando a dificuldade muda

  // Iniciar sessão no backend (se usares)
  useEffect(() => {
    async function startGame() {
      try {
        const res = await fetch(`${apiUrl}/start_game`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();
        if (data?.token) localStorage.setItem("gameToken", data.token);
        if (data?.sessionHash) localStorage.setItem("sessionHash", data.sessionHash);
      } catch (e) {
        console.error("Erro em /start_game:", e);
      }
    }
    startGame();
  }, [difficulty]);

  // limpar inputs
  function clear() {
    setLeftValue("");
    setOperator("");
    setRightValue("");
    setResultMessage("");
  }

  // clicar num número disponível preenche o próximo campo
  function applyAvailableNumber(n) {
    if (leftValue === "") setLeftValue(String(n)); // se o campo da esq está vazio, preenche
    else if (rightValue === "") setRightValue(String(n)); // se o campo da dir está vazio, preenche
  }

  // operação segura
  function safeOperate(a, op, b) {
    switch (op) {
      case "+": return { ok: true, value: a + b };
      case "-": return { ok: true, value: a - b };
      case "*": return { ok: true, value: a * b };
      case "/":
        if (b === 0) return { ok: false, msg: "Não podes dividir por 0." };
        if (a % b !== 0) return { ok: false, msg: "Os números devem ser divisíveis." };
        return { ok: true, value: Math.floor(a / b) };
      default:  return { ok: false, msg: "Operador inválido." };
    }
  }

  // ------ Submissão de uma jogada -----
  async function submit() {
    if (!isValid) { // validacao do input
      setResultMessage("Completa a expressão antes de submeter.");
      return;
    }

    const a = Number(leftValue);
    const b = Number(rightValue);

    if (!availableNumbers.includes(a) || !availableNumbers.includes(b)) {
      setResultMessage("Ambos os números têm de estar disponíveis.");
      return;
    }

    const res = safeOperate(a, operator, b);
    if (!res.ok) {
      setResultMessage(res.msg);
      return;
    }

    if (availableNumbers.includes(res.value)) {
      setResultMessage(`O número ${res.value} já foi usado! Tenta outra expressão.`);
      return;
    }

    // atualiza estado local
    const next = [...availableNumbers, res.value].sort((x, y) => x - y); // if x-y < 0, x vem antes de y
    setAvailableNumbers(next);
    setStepCount((s) => s + 1);
    clear();

    // check vitoria
    if (res.value === goalNumber) {
      const secs = (Date.now() - (startTime ?? Date.now())) / 1000;
      setElapsedTime(secs);
      setShowUsernameInput(true);
      setResultMessage("Vitória!");
      // (Opcional) report ao backend
      // await fetch(`${apiUrl}/finish_game`, { method: "POST", body: JSON.stringify({...}) })
    }

    // (Opcional) report de jogada
    // try {
    //   await fetch(`${apiUrl}/submit`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ a, b, op: operator, result: res.value, difficulty }),
    //   });
    // } catch (e) {
    //   console.error("Falha a reportar jogada:", e);
    // }
  }

  // funcoes de popup do menu
  function openTutorial()  { setShowTutorial(true); }
  function openCredits()   { setShowCredits(true); }
  function openLeaderboard(){ setShowLeaderboard(true); }
  function closeAllPopups() {
    setShowTutorial(false);
    setShowCredits(false);
    setShowLeaderboard(false);
  }
  function closeUsernameInputPopup() {
	setShowUsernameInput(false);
  }

  return {
    // jogo/estado
    difficulty, setDifficulty,
    goalNumber, stepCount, availableNumbers,
    loading, isValid, resultMessage, showUsernameInput, elapsedTime,

    // inputs
    leftValue, setLeftValue,
    operator, setOperator,
    rightValue, setRightValue,
    leftRef, opRef, rightRef,

    // ações
    clear, submit, applyAvailableNumber,

    // popups
    showTutorial, showCredits, showLeaderboard,
    openTutorial, openCredits, openLeaderboard, closeAllPopups,
	closeUsernameInputPopup,
  };
}
