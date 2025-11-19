import React, { useState } from 'react';
import { Delete } from 'lucide-react';

const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const performOperation = (nextOperator: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator) {
      const currentValue = prevValue || 0;
      const newValue = calculate(currentValue, inputValue, operator);
      setPrevValue(newValue);
      setDisplay(String(newValue));
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (prev: number, next: number, op: string) => {
    switch (op) {
      case '+': return prev + next;
      case '-': return prev - next;
      case '×': return prev * next;
      case '÷': return prev / next;
      default: return next;
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const Button = ({ label, onClick, className = "" }: any) => (
    <button 
      className={`flex items-center justify-center text-xl font-medium transition-colors ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <div className="h-full w-full flex flex-col bg-[#333] text-white">
      <div className="flex-grow flex items-end justify-end p-4 text-5xl font-light break-all bg-[#2c2c2c]">
        {display}
      </div>
      <div className="grid grid-cols-4 grid-rows-5 h-3/5 gap-px bg-[#3e3e3e] border-t border-[#3e3e3e]">
        <Button label="C" onClick={handleClear} className="bg-[#454545] hover:bg-[#505050] text-[#E95420]" />
        <Button label="±" onClick={() => {}} className="bg-[#454545] hover:bg-[#505050]" />
        <Button label="%" onClick={() => {}} className="bg-[#454545] hover:bg-[#505050]" />
        <Button label="÷" onClick={() => performOperation('÷')} className="bg-[#E95420] hover:bg-[#d64718]" />

        <Button label="7" onClick={() => inputDigit('7')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="8" onClick={() => inputDigit('8')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="9" onClick={() => inputDigit('9')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="×" onClick={() => performOperation('×')} className="bg-[#E95420] hover:bg-[#d64718]" />

        <Button label="4" onClick={() => inputDigit('4')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="5" onClick={() => inputDigit('5')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="6" onClick={() => inputDigit('6')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="-" onClick={() => performOperation('-')} className="bg-[#E95420] hover:bg-[#d64718]" />

        <Button label="1" onClick={() => inputDigit('1')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="2" onClick={() => inputDigit('2')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="3" onClick={() => inputDigit('3')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="+" onClick={() => performOperation('+')} className="bg-[#E95420] hover:bg-[#d64718]" />

        <Button label="0" onClick={() => inputDigit('0')} className="col-span-2 bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="." onClick={() => inputDigit('.')} className="bg-[#333] hover:bg-[#3d3d3d]" />
        <Button label="=" onClick={() => performOperation('=')} className="bg-[#E95420] hover:bg-[#d64718]" />
      </div>
    </div>
  );
};

export default CalculatorApp;