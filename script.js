document.addEventListener('DOMContentLoaded', function() {
    const bombeSimulator = document.getElementById('bombe-simulator');

    // Add labels
    const labels = ['PLAINTEXT', '', 'STECKERED', '', 'WHEEL POS', 'STECKERED', '', 'CIPHERTEXT'];
    labels.forEach((text, index) => {
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = text;
        if (text === 'WHEEL POS') {
            label.classList.add('wheel-pos-label');
            label.style.gridRow = 'span 3';
        }
        label.style.gridColumn = 1;
        bombeSimulator.appendChild(label);
    });

    // Function to add elements to a specific row
    function addRowElements(rowIndex, elementType, className, count) {
        for (let i = 0; i < count; i++) {
            const element = document.createElement(elementType);
            element.className = className;
            if (elementType === 'input') {
                element.type = 'text';
                element.maxLength = 1;
            }
            element.style.gridRow = rowIndex + 1;
            element.style.gridColumn = i + 2; // +2 because the first column is for labels
            bombeSimulator.appendChild(element);
        }
    }

    // Add elements for each row
    addRowElements(0, 'input', 'letter-input plaintext', 32);
    addRowElements(1, 'button', 'small-button', 32);
    addRowElements(2, 'input', 'letter-input steckered', 32);

    // Add scrambler labels
    for (let i = 0; i < 32; i++) {
        const label = document.createElement('div');
        label.className = 'scrambler-label';
        label.textContent = 'SCRAMBLER'.split("").sort(() => 0.5 - Math.random()).join("") + ' ' + String(i + 1).padStart(2, '0');
        label.style.gridRow = String(4);
        label.style.gridColumn = String(i + 2);
        bombeSimulator.appendChild(label);
    }

    // Add wheel position inputs (3 rows)
    for (let i = 0; i < 3; i++) {
        addRowElements(4 + i, 'input', 'letter-input wheel-pos', 32);
    }

    addRowElements(7, 'input', 'letter-input steckered', 32);
    addRowElements(8, 'button', 'small-button', 32);
    addRowElements(9, 'input', 'letter-input ciphertext', 32);
});