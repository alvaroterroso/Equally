import React from "react";

const OPS = ["+", "-", "*", "/"];

export default function OperatorPicker({ operator, onChange }) {
  return (
    <div style={{ marginTop: 10 }}>
      {OPS.map((op) => (
        <button
          key={op}
          className={`usable-buttons ${operator === op ? "highlight" : ""}`}
          onClick={() => onChange(op)}
          type="button"
        >
          {op}
        </button>
      ))}
    </div>
  );
}
