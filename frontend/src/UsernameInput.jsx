import React, { useCallback, useState } from 'react';

function UsernameInput({ steps, difficulty, onScoreSubmit }) {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // New state to track submission status

  const handleSubmit = useCallback(async () => {
	if (isSubmitting) return;
	setIsSubmitting(true); // deixar o button de submissão aberto 
  
	const apiUrl = process.env.REACT_APP_API_URL;
	const token = localStorage.getItem("gameToken");
	const sessionHash = localStorage.getItem("sessionHash");
	const time = Math.round((Date.now() - localStorage.getItem("gameStartTime")) / 1000);
  
	if (!token) {
	  console.error("Nenhum token JWT encontrado! Abortando submissão.");
	  setIsSubmitting(false);
	  return;
	}
  
	try {
	  const res = await fetch(`${apiUrl}/submit_score`, {
		method: "POST",
		headers: {
		  "Content-Type": "application/json",
		  "Authorization": `Bearer ${token}`,
		},
		body: JSON.stringify({ username, difficulty, score: steps, time, sessionHash }),
	  });
  
	  const data = await res.json();
	  console.log("Score submetido com sucesso!", data);
  
	  if (typeof onScoreSubmit === "function") {
		onScoreSubmit();
	  } else {
		console.warn("onScoreSubmit não foi passado corretamente!");
	  }
	} catch (error) {
	  console.error("Erro ao submeter score:", error);
	} finally {
	  setIsSubmitting(false);
	}
  },[username, steps, difficulty, onScoreSubmit, isSubmitting]);

  return (
    <div id="username-layout" className="mt-3">
      <label htmlFor="username">Enter your username:</label>
      <input
        type="text"
        className="form-control"
        id="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        isVisible={isSubmitting} // Disable input when submission is in progress
      />
      <button
        className="btn btn-primary mt-2"
        onClick={handleSubmit}
        disabled={isSubmitting}  // Disable button when submission is in progress
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}  {/* Provide feedback to the user */}
      </button>
    </div>
  );
}

export default UsernameInput;
