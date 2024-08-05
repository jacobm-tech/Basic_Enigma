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

    // Add event listeners for input functionality
    const allInputs = document.querySelectorAll('.letter-input');
    allInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                e.preventDefault();
                this.value = e.key.toUpperCase();
                if (index < allInputs.length - 1) {
                    allInputs[index + 1].focus();
                }
            } else if (e.key === 'Backspace' && this.value === '') {
                e.preventDefault();
                if (index > 0) {
                    allInputs[index - 1].focus();
                }
            }
        });
    });

    // Add event listeners for initial setting inputs
    const initialSettingInputs = document.querySelectorAll('.initial-setting');
    initialSettingInputs.forEach((input, index) => {
        input.addEventListener('keydown', function(e) {
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                e.preventDefault();
                this.value = e.key.toUpperCase();
                if (index < initialSettingInputs.length - 1) {
                    initialSettingInputs[index + 1].focus();
                }
                updateWheelPositions();
            } else if (e.key === 'Backspace' && this.value === '') {
                e.preventDefault();
                if (index > 0) {
                    initialSettingInputs[index - 1].focus();
                }
            }
        });
    });

    function updateWheelPositions() {
        const initialSetting = Array.from(initialSettingInputs).map(input => input.value).join('');
        if (initialSetting.length === 3) {
            const wheelPosInputs = document.querySelectorAll('.wheel-pos');
            for (let i = 0; i < 32; i++) {
                let setting = incrementSetting(initialSetting, i);
                for (let j = 0; j < 3; j++) {
                    wheelPosInputs[i + j * 32].value = setting[j];
                }
            }
        }
    }

    function incrementSetting(setting, increment) {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = setting.split('');
        for (let i = 0; i < increment; i++) {
            result[0] = alphabet[(alphabet.indexOf(result[0]) + 1) % 26];
            if (result[0] === 'A') {
                result[1] = alphabet[(alphabet.indexOf(result[1]) + 1) % 26];
                if (result[1] === 'A') {
                    result[2] = alphabet[(alphabet.indexOf(result[2]) + 1) % 26];
                }
            }
        }
        return result.join('');
    }
});