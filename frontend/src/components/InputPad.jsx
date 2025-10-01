import React from "react";

const onlyDigits = (s) => s.replace(/[^\d]/g, "");
const onlyOperator = (s) => s.replace(/[^+\-*/]/g, "").slice(0, 1);

function InputPad({
  leftValue, onLeftChange,
  operator, onOperatorChange,
  rightValue, onRightChange,
  initialNumber,
}) {
  return (
    <div className="number-list">
      <input
        className="expression-square"
        inputMode="numeric"
        value={leftValue}
        onChange={(e) => onLeftChange(onlyDigits(e.target.value))}
        placeholder={initialNumber}
        aria-label="primeiro número"
      />
      <input
        className="expression-square"
        value={operator}
        onChange={(e) => onOperatorChange(onlyOperator(e.target.value))}
        placeholder="+ - * /"
        aria-label="operador"
      />
      <input
        className="expression-square"
        inputMode="numeric"
        value={rightValue}
        onChange={(e) => onRightChange(onlyDigits(e.target.value))}
        placeholder={initialNumber}
        aria-label="segundo número"
      />
    </div>
  );
}
export default React.memo(InputPad);