import React from "react";

export default function DifficultyMenu({ value, onChange }) {
  return (
    <div className="form-group">
      <label className="choose-diff">Dificuldade</label>
      <select
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value={1}>Fácil (1-100)</option>
        <option value={2}>Médio (1-1000)</option>
        <option value={3}>Difícil (1-10000)</option>
      </select>
    </div>
  );
}
