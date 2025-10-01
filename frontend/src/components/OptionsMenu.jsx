import React, { useEffect, useRef, useState, useCallback } from "react";

export default function OptionsMenu({
  onShowTutorial,
  onShowCredits,
  onShowLeaderboard,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const toggleOpen = useCallback(() => {
	setOpen((o) => !o);
  },[]);

  const handeTutorial = useCallback(() => {
	setOpen(false);
	onShowTutorial?.(); // ?. confirma se função ficou undef (passada pelo pai) 
},[onShowTutorial]);

  const handleCredits = useCallback(() => {
	setOpen(false);
	onShowCredits()?.();
  },[onShowCredits]);

  const handleLeaderboard = useCallback(() => {
	setOpen(false);
	onShowLeaderboard()?.();
  },[onShowLeaderboard]);


  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="help-container" ref={ref}>
		{/* Abre e fecha o menu*/}
      <button className="help-button" onClick={toggleOpen}> 
        ⋯
      </button>
      {open && (
        <div className="help-menu">
			{/* onClick ativa dá trigger à função no pai */}
          <button onClick={handeTutorial}>
            Tutorial
          </button>
          <button onClick={handleCredits}>
            Créditos
          </button>
          <button onClick={handleLeaderboard}>
            Leaderboard
          </button>
        </div>
      )}
    </div>
  );
}
