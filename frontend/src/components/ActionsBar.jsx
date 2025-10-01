import React from "react";

function ActionsBar({ onClear, onSubmit, isSubmitDisabled }) {
  return (
    <div style={{ marginTop: 16 }}>
      <button className="clear-button" onClick={onClear} type="button">
        Limpar
      </button>
      <button
        className="submit-button"
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        type="button"
      >
        Submeter
      </button>
    </div>
  );
}

export default React.memo(ActionsBar);
