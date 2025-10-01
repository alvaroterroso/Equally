// src/pages/Game.jsx
import React, { useCallback } from "react";
import "./Game.css";

import useGameLogic from "../hooks/useGameLogic";
import DifficultyMenu from "../components/DifficultyMenu";
import OptionsMenu from "../components/OptionsMenu";
import InputPad from "../components/InputPad";
import ActionsBar from "../components/ActionsBar";
import Leaderboard from "../Leaderboard";
import UsernameInput from "../UsernameInput";

export default function Game() {
  const {
    // jogo/state
    difficulty, setDifficulty,
    goalNumber, stepCount, availableNumbers,
    loading, isValid, resultMessage, showUsernameInput, elapsedTime,

    // inputs
    leftValue, setLeftValue,
    operator, setOperator,
    rightValue, setRightValue,

    // ações
    clear, submit, applyAvailableNumber,

    // popups
    showTutorial, showCredits, showLeaderboard,
    openTutorial, openCredits, openLeaderboard, closeAllPopups,
	closeUsernameInputPopup,
  } = useGameLogic();

  const handleLeftChange = useCallback((v) => setLeftValue(v), [setLeftValue]);
  const handleRightChange = useCallback((v) => setRightValue(v), [setRightValue]);
  const handleOperatorChange = useCallback((v) => setOperator(v), [setOperator]);

  const handleSubmit = useCallback(() => submit(), [submit]);
  const handleClear = useCallback(() => clear(), [clear]);

  // Operator só entra na expressão quando 1º número já está preenchido e 2º não
  const handleOperatorClick = useCallback((selectedOperator) => {
    if (leftValue !== "" && operator === "" && rightValue === "") { // uses === para evitar bugs
      setOperator(selectedOperator);
    }
  }, [leftValue, operator, rightValue, setOperator]); // gere quando é que a referencia é recriada

  return (
    <div className="game-container">
      <h1 className="title">Equally</h1>

      <div className="top-bar">
		<DifficultyMenu value={difficulty} onChange={setDifficulty} />
		<OptionsMenu
			onShowTutorial={openTutorial}
			onShowCredits={openCredits}
			onShowLeaderboard={openLeaderboard}
		/>
		</div>


      {loading && <div className="loading-message">Os números podem demorar a carregar…</div>}

      {/* Números disponíveis (vindos do backend e dos resultados) */}
      <p>Números disponíveis</p>
      <div className="number-list">
		{/* Escusamos de usar ${n}-${i} para a key, porque não há números duplicados, então {n} basta*/}
        {availableNumbers.map((n) => (
          <button
            key={`${n}`}
            className="usable-buttons"
            onClick={() => applyAvailableNumber(n)}
            type="button"
          >
            {n}
          </button>
        ))}
      </div>

      {/* Input principal: [n] [op] [n] */}
      <InputPad
        leftValue={leftValue}
        onLeftChange={handleLeftChange}
        operator={operator}
        onOperatorChange={handleOperatorChange}
        rightValue={rightValue}
        onRightChange={handleRightChange}
        initialNumber={availableNumbers[0]} // placeholder do 1º número vindo do backend
      />

      {/* Botões para escolher o operador */}
      <div className="mt-3">
        <button className="btn-info" onClick={() => handleOperatorClick("+")} type="button">+</button>
        <button className="btn-info" onClick={() => handleOperatorClick("-")} type="button">-</button>
        <button className="btn-info" onClick={() => handleOperatorClick("*")} type="button">x</button>
        <button className="btn-info" onClick={() => handleOperatorClick("/")} type="button">:</button>
      </div>

      {/* Ações */}
      <ActionsBar onClear={handleClear} onSubmit={handleSubmit} isSubmitDisabled={!isValid || loading} />

      {/* feedback + métricas */}
      {!!resultMessage && (
        <div className="mt-3">
          <p>{resultMessage}</p>
        </div>
      )}
      <div className="step-count">Passos: {stepCount}</div>
      <div className="goal-number">Objetivo: {goalNumber}</div>

      {/* Popups */}
      {showTutorial && (
        <div className="tutorial-popup active">
          <button className="close-button" onClick={closeAllPopups}>x</button>
          <h2>Como Jogar!</h2>
			<p>Tenta chegar ao número final usando 1 número e os resultados das operações básicas com ele</p>
			<p>Exemplo:</p>
			<p>Chegar ao  <span className = "final-highlight">3</span> começando no <span className = "highlight">7</span></p>
			<p>Passo 1: Números disponíveis: <span className = "highlight">7</span> <br /> <span className = "highlight">7</span> + <span className = "highlight">7</span> = <span className="highlight">14</span></p>
			<p>Passo 2: Números disponíveis: <span className = "highlight">7</span> <span className = "highlight">14</span> <br /> <span className = "highlight">14</span> + <span className = "highlight">7</span> = <span className = "highlight">21</span></p>
			<p>Passo 3: Números disponíveis: <span className = "highlight">7</span> <span className = "highlight">14</span> <span className = "highlight">21</span> <br /> <span className = "highlight">21</span> / <span className = "highlight">7</span> = <span className = "final-highlight">3</span></p>
			<p> <span className = "danger-highlight">Atenção: só podes usar números que estejam disponíveis!</span></p>
			<p>Um desafio novo é gerado todos os dias</p>
        </div>
      )}

      {showCredits && (
        <div className="tutorial-popup active">
          <button className="close-button" onClick={closeAllPopups}>x</button>
          <h1>Créditos</h1>
          <p>Feito por um gajo de Barcelos</p>
          <p>#5A8B9B</p>
        </div>
      )}

      {showLeaderboard && (
        <div className="tutorial-popup active leaderboard-popup">
          <button className="close-button" onClick={closeAllPopups}>x</button>
          <Leaderboard difficulty={difficulty} isVisible={showLeaderboard} onClose={closeAllPopups} />
        </div>
      )}

      {/* Username após vitória */}
      {showUsernameInput && (
		<UsernameInput
			steps={stepCount}
			difficulty={difficulty}
			onScoreSubmit={() => {
			closeAllPopups();
			closeUsernameInputPopup();
			openLeaderboard();
			}}
		/>
		)}
    </div>
  );
}
