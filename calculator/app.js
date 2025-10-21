class Calculator {
    constructor(previousOperandElement, currentOperandElement) {
        this.previousOperandElement = previousOperandElement;
        this.currentOperandElement = currentOperandElement;
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.clear();
        this.updateDisplay();
        this.loadHistory();
    }

    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
    }

    delete() {
        if (this.currentOperand === '0') return;
        if (this.currentOperand.length === 1) {
            this.currentOperand = '0';
        } else {
            this.currentOperand = this.currentOperand.slice(0, -1);
        }
    }

    appendNumber(number) {
        if (this.shouldResetScreen) {
            this.currentOperand = '0';
            this.shouldResetScreen = false;
        }

        if (number === '.' && this.currentOperand.includes('.')) return;

        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand += number;
        }
    }

    chooseOperation(operation) {
        if (this.currentOperand === '') return;

        if (this.previousOperand !== '') {
            this.compute();
        }

        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '0';
    }

    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);

        if (isNaN(prev) || isNaN(current)) return;

        switch (this.operation) {
            case '+':
                computation = prev + current;
                break;
            case '-':
                computation = prev - current;
                break;
            case '×':
                computation = prev * current;
                break;
            case '÷':
                if (current === 0) {
                    alert('Нельзя делить на ноль!');
                    this.clear();
                    this.updateDisplay();
                    return;
                }
                computation = prev / current;
                break;
            default:
                return;
        }

        // Add to history
        const expression = `${this.formatNumber(prev)} ${this.operation} ${this.formatNumber(current)}`;
        const result = this.formatNumber(computation);
        this.addToHistory(expression, result);

        this.currentOperand = computation.toString();
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
    }

    calculatePercent() {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current)) return;

        if (this.previousOperand !== '' && this.operation) {
            // Calculate percentage of previous operand
            const prev = parseFloat(this.previousOperand);
            const percentage = (prev * current) / 100;
            this.currentOperand = percentage.toString();
        } else {
            // Convert to decimal
            this.currentOperand = (current / 100).toString();
        }
    }

    changeSign() {
        const current = parseFloat(this.currentOperand);
        if (isNaN(current) || current === 0) return;
        this.currentOperand = (current * -1).toString();
    }

    formatNumber(number) {
        if (isNaN(number)) return '';

        // Handle very large or very small numbers
        if (Math.abs(number) > 999999999999 || (Math.abs(number) < 0.000001 && number !== 0)) {
            return number.toExponential(6);
        }

        // Round to avoid floating point errors
        const rounded = Math.round(number * 100000000) / 100000000;

        const stringNumber = rounded.toString();
        const [integer, decimal] = stringNumber.split('.');

        // Add thousands separators
        const integerFormatted = parseInt(integer).toLocaleString('ru-RU');

        if (decimal != null) {
            return `${integerFormatted}.${decimal}`;
        } else {
            return integerFormatted;
        }
    }

    updateDisplay() {
        this.currentOperandElement.textContent = this.formatNumber(parseFloat(this.currentOperand)) || '0';

        if (this.operation != null) {
            this.previousOperandElement.textContent =
                `${this.formatNumber(parseFloat(this.previousOperand))} ${this.operation}`;
        } else {
            this.previousOperandElement.textContent = '';
        }
    }

    addToHistory(expression, result) {
        const historyItem = {
            expression: expression,
            result: result,
            timestamp: new Date().toLocaleString('ru-RU')
        };

        this.history.unshift(historyItem);

        // Keep only last 20 items
        if (this.history.length > 20) {
            this.history = this.history.slice(0, 20);
        }

        // Save to localStorage
        localStorage.setItem('calculatorHistory', JSON.stringify(this.history));

        // Update history display
        this.loadHistory();
    }

    loadHistory() {
        const historyContainer = document.getElementById('historyContainer');
        const historyElement = document.getElementById('history');

        if (this.history.length === 0) {
            historyContainer.style.display = 'none';
            return;
        }

        historyContainer.style.display = 'block';
        historyElement.innerHTML = '';

        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-expression">${item.expression}</span>
                <span class="history-result">= ${item.result}</span>
            `;
            historyElement.appendChild(historyItem);
        });
    }

    clearHistory() {
        if (confirm('Очистить всю историю вычислений?')) {
            this.history = [];
            localStorage.removeItem('calculatorHistory');
            this.loadHistory();
        }
    }
}

// Initialize calculator
const previousOperandElement = document.getElementById('previousOperand');
const currentOperandElement = document.getElementById('currentOperand');
const calculator = new Calculator(previousOperandElement, currentOperandElement);

// Update display on any action
function updateAfterAction() {
    calculator.updateDisplay();
}

// Add event listeners to all buttons
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', updateAfterAction);
});

// Keyboard support
document.addEventListener('keydown', (e) => {
    // Numbers
    if (e.key >= '0' && e.key <= '9') {
        calculator.appendNumber(e.key);
        calculator.updateDisplay();
    }

    // Decimal point
    if (e.key === '.' || e.key === ',') {
        calculator.appendNumber('.');
        calculator.updateDisplay();
    }

    // Operations
    if (e.key === '+') {
        calculator.chooseOperation('+');
        calculator.updateDisplay();
    }
    if (e.key === '-') {
        calculator.chooseOperation('-');
        calculator.updateDisplay();
    }
    if (e.key === '*') {
        calculator.chooseOperation('×');
        calculator.updateDisplay();
    }
    if (e.key === '/') {
        e.preventDefault(); // Prevent browser search
        calculator.chooseOperation('÷');
        calculator.updateDisplay();
    }

    // Equals
    if (e.key === 'Enter' || e.key === '=') {
        calculator.compute();
        calculator.updateDisplay();
    }

    // Clear
    if (e.key === 'Escape') {
        calculator.clear();
        calculator.updateDisplay();
    }

    // Delete
    if (e.key === 'Backspace') {
        calculator.delete();
        calculator.updateDisplay();
    }

    // Percent
    if (e.key === '%') {
        calculator.calculatePercent();
        calculator.updateDisplay();
    }
});

// Prevent context menu on buttons for better mobile experience
document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
});

console.log('Калькулятор загружен и готов к использованию!');
