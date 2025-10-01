import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

function Leaderboard({ difficulty, isVisible, onClose }) {
  const [scores, setScores] = useState([]);

  useEffect(() => {
	if (!isVisible) return;

	const apiUrl = process.env.REACT_APP_API_URL;
	async function loadScores() {
	  try {
		const res = await fetch(`${apiUrl}/get_top_scores?difficulty=${difficulty}`);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
		const data = await res.json();
		console.log("Fetched scores: ", data.scores);
		setScores(data.scores);
	  } catch (e) {
		console.error("Erro ao buscar os scores:", e);
	  } finally {
		console.log("Leaderboard fetch terminou");
	  }
	}
  
	loadScores();
  
	return () => {
		console.log("Leaderboard desmontado");
		};
	}, [difficulty, isVisible]);
	// Dependências: difficulty e isVisible

  // Se o componente não estiver visível, não renderiza nada
  if (!isVisible) {
    return null;
  }

  return (
    <div className="leaderboard-popup">
      <h2>Top 5 Jogadores - Dificuldade {difficulty}</h2>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Jogador</th>
            <th>Pontuação</th>
          </tr>
        </thead>
        <tbody>
          {scores.length === 0 ? (
            <tr>
              <td colSpan="3">Nenhum jogador nesta dificuldade</td>
            </tr>
          ) : (
            scores.map((score, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{score.player}</td>
                <td>{score.score}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Leaderboard;