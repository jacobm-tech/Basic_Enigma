document.addEventListener('DOMContentLoaded', function() {
    const bombeSimulator = document.getElementById('bombe-simulator');
    const plugboardTable = document.querySelector('#plugboard table');
    const fastRotorSelect = document.getElementById('fast-rotor');
    const middleRotorSelect = document.getElementById('middle-rotor');
    const slowRotorSelect = document.getElementById('slow-rotor');
    const advanceRotorsButton = document.getElementById('advance-rotors');
    const plugboardStatus = document.getElementById('plugboard-status');

    const fastInitialSetting = document.getElementById('fast-rotor-initial');
    const midInitialSetting = document.getElementById('mid-rotor-initial');
    const slowInitialSetting = document.getElementById('slow-rotor-initial');


    // Add labels
    const labels = ['PLAINTEXT', '', 'STECKERED', '', 'FAST', 'MIDDLE', 'SLOW', 'STECKERED', '', 'CIPHERTEXT'];
    labels.forEach((text/*, index*/) => {
        const label = document.createElement('div');
        label.className = 'label';
        label.textContent = text;
        // if (text === 'WHEEL POS') {
        //     label.classList.add('wheel-pos-label');
        //     label.style.gridRow = 'span 3';
        // }
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

                if (className.includes('wheel-pos')) {
                    element.readOnly = true;
                }
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

    // Create plugboard rows
    for (let i = 1; i <= 10; i++) {
        const row = plugboardTable.insertRow();
        const cellNumber = row.insertCell(0);
        const cellLetter1 = row.insertCell(1);
        const cellLetter2 = row.insertCell(2);

        cellNumber.textContent = i;
        cellLetter1.textContent = '';
        cellLetter2.textContent = '';
    }

    // Add event listeners for input functionality
    const allInputs = document.querySelectorAll('.letter-input');
    allInputs.forEach((input, index) => {
        if (input.className.includes('wheel-pos')) {
            return;
        }
        input.addEventListener('keydown', function (e) {
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                e.preventDefault();
                this.value = e.key.toUpperCase();
                if (index < allInputs.length - 1) {
                    allInputs[index + 1].focus();
                }
                if (this.className.includes('steckered')){
                    handleSteckeredInput(this, e.key.toUpperCase());
                }
                saveState();
                updateAdjacentButtons(this);
            } else if (e.key === 'Backspace' && this.value === '') {
                e.preventDefault();
                if (index > 0) {
                    allInputs[index - 1].focus();
                }
                updateAdjacentButtons(this);
            }
        });

        input.addEventListener('input', function() {
            updateAdjacentButtons(this);
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
                saveState();
                updateWheelPositions();
            } else if (e.key === 'Backspace' && this.value === '') {
                e.preventDefault();
                if (index > 0) {
                    initialSettingInputs[index - 1].focus();
                }
            }
        });
    });

    // Add event listeners for small buttons
    const smallButtons = document.querySelectorAll('.small-button');
    smallButtons.forEach((button, index) => {
        button.addEventListener('click', function() {
            if (this.classList.contains('active')) {
                const isTopRow = index < 32;
                const aboveInput = isTopRow ? allInputs[index] : allInputs[index + 128];
                const belowInput = isTopRow ? allInputs[index + 32] : allInputs[index + 160];
                updatePlugboard(aboveInput.value, belowInput.value);
            }
        });
    });

    function updateAdjacentButtons(input) {
        const index = Array.from(allInputs).indexOf(input);
        let buttonIndex, otherInput;

        if (index < 32) {
            // Top row of inputs
            buttonIndex = index;
            otherInput = allInputs[index + 32];
        } else if (index >= 32 && index < 64) {
            // Second row of inputs
            buttonIndex = index - 32;
            otherInput = allInputs[index - 32];
        } else if (index >= 160 && index < 192) {
            // Third row of inputs
            buttonIndex = index - 160 + 32;
            otherInput = allInputs[index + 32];
        } else if (index >= 192) {
            // Bottom row of inputs
            buttonIndex = index - 192 + 32;
            otherInput = allInputs[index - 32];
        }

        const button = smallButtons[buttonIndex];

        if (input.value && otherInput.value) {
            button.classList.add('active');
            button.style.backgroundColor = 'green';
        } else {
            button.classList.remove('active');
            button.style.backgroundColor = '#ddd';
        }
    }

    function updatePlugboard(letter1, letter2) {
        if (letter1 === letter2) {
            return; // Do nothing if both letters are the same
        }

        const existingPair = findExistingPair(letter1, letter2);
        if (existingPair) {
            if ((existingPair[0] === letter1 && existingPair[1] === letter2) ||
                (existingPair[0] === letter2 && existingPair[1] === letter1)) {
                return; // Do nothing if the pair already exists
            } else {
                setPlugboardStatus('INCONSISTENT', 'red');
                return;
            }
        }

        const emptyRow = Array.from(plugboardTable.rows).find(row => !row.cells[1].textContent);
        if (emptyRow) {
            emptyRow.cells[1].textContent = letter1;
            emptyRow.cells[2].textContent = letter2;
            highlightPlugboardRow(emptyRow);
        } else {
            setPlugboardStatus('FULL', 'red');
        }
    }

    function findExistingPair(letter1, letter2) {
        for (let row of plugboardTable.rows) {
            const l1 = row.cells[1].textContent;
            const l2 = row.cells[2].textContent;
            if (l1 === letter1 || l1 === letter2 || l2 === letter1 || l2 === letter2) {
                return [l1, l2];
            }
        }
        return null;
    }

    function highlightPlugboardRow(row) {
        // Remove highlight from all rows
        Array.from(plugboardTable.rows).forEach(r => r.style.backgroundColor = '');
        // Highlight the updated row
        row.style.backgroundColor = 'yellow';
    }

    function updateWheelPositions() {
        let fastSetting = fastInitialSetting.value;
        let midSetting = midInitialSetting.value;
        let slowSetting = slowInitialSetting.value;
        let initialSetting = fastSetting + midSetting + slowSetting;

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

    // Function to advance rotors
    function advanceRotors() {
        let fastSetting = fastInitialSetting.value;
        let midSetting = midInitialSetting.value;
        let slowSetting = slowInitialSetting.value;
        let initialSetting = fastSetting + midSetting + slowSetting;

        let setting = incrementSetting(initialSetting, 1);
        slowInitialSetting.value = setting[2];
        midInitialSetting.value = setting[1];
        fastInitialSetting.value = setting[0];

        saveState();
        updateWheelPositions();
    }

    // Add event listener for ADVANCE ROTORS button
    advanceRotorsButton.addEventListener('click', advanceRotors);

    function saveState() {
        const plaintext = Array.from(document.querySelectorAll('.plaintext')).map(input => input.value).join(',');
        const steckered1 = Array.from(document.querySelectorAll('.steckered')).slice(0, 32).map(input => input.value).join(',');
        const wheelPos = Array.from(document.querySelectorAll('.wheel-pos')).map(input => input.value).join(',');
        const steckered2 = Array.from(document.querySelectorAll('.steckered')).slice(32).map(input => input.value).join(',');
        const ciphertext = Array.from(document.querySelectorAll('.ciphertext')).map(input => input.value).join(',');
        const initialSetting = Array.from(document.querySelectorAll('.initial-setting')).map(input => input.value).join(',');
        const fastRotor = fastRotorSelect.value;
        const middleRotor = middleRotorSelect.value;
        const slowRotor = slowRotorSelect.value;

        const state = {
            plaintext, steckered1, wheelPos, steckered2, ciphertext, initialSetting,
            fastRotor, middleRotor, slowRotor
        };

        localStorage.setItem('bombeState', JSON.stringify(state));
    }

    function loadState() {
        console.log('Loading state...'); // Debug log
        const stateJson = localStorage.getItem('bombeState');
        if (stateJson) {
            const state = JSON.parse(stateJson);

            setInputValues('.plaintext', state.plaintext);
            setInputValues('.steckered', state.steckered1, 0);
            setInputValues('.wheel-pos', state.wheelPos);
            setInputValues('.steckered', state.steckered2, 32);
            setInputValues('.ciphertext', state.ciphertext);
            setInputValues('.initial-setting', state.initialSetting);

            fastRotorSelect.value = state.fastRotor;
            middleRotorSelect.value = state.middleRotor;
            slowRotorSelect.value = state.slowRotor;

            updateWheelPositions();
            console.log('State loaded:', state); // Debug log
        } else {
            console.log('No saved state found.'); // Debug log
        }
    }

    function setInputValues(selector, values, startIndex = 0) {
        const inputs = document.querySelectorAll(selector);
        values = values.split(',')
        for (let i = 0; i < values.length; i++) {
            inputs[i + startIndex].value = values[i];
        }
    }

    // Load state when the page loads
    loadState();

    // Call updateRotorPositions initially to set the default values
    updateWheelPositions();

    const ROTOR_WIRINGS = {
        'I': 'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
        'II': 'AJDKSIRUXBLHWTMCQGZNPYFVOE',
        'III': 'BDFHJLCPRTXVZNYEIWGAKMUSQO',
        'IV': 'ESOVPZJAYQUIRHXLNFTGKDCMWB',
        'V': 'VZBRGITYUPSDNHLXAWMJQOFECK'
    };

    const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT'

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Enigma simulation functions
    function rotorForward(letter, wiring) {
        const index = ALPHABET.indexOf(letter);
        return wiring[index];
    }

    function rotorReverse(letter, wiring) {
        const index = wiring.indexOf(letter);
        return ALPHABET[index];
    }

    function reflector(letter) {
        const index = REFLECTOR.indexOf(letter);
        return ALPHABET[index];
    }

    function enigmaEncrypt(letter, rotors, positions) {
        // Implement the full Enigma encryption process here
        let result = letter;

        // Forward through rotors
        for (let i = 0; i < 3; i++) {
            const offset = ROTOR_WIRINGS[rotors[i]].indexOf(positions[i]);
            const shiftedRotor = ROTOR_WIRINGS[rotors[i]].slice(offset) +
                                 ROTOR_WIRINGS[rotors[i]].slice(0,offset);
            result = rotorForward(result, shiftedRotor);
        }

        // Reflector
        result = reflector(result);

        // Backward through rotors
        for (let i = 2; i >= 0; i--) {
            const offset = ROTOR_WIRINGS[rotors[i]].indexOf(positions[i]);
            const shiftedRotor = ROTOR_WIRINGS[rotors[i]].slice(offset) +
                                 ROTOR_WIRINGS[rotors[i]].slice(0, offset);
            result = rotorReverse(result, shiftedRotor);
        }

        return result;
    }

    function handleSteckeredInput(input, letter) {
        if (letter.length === 1 && letter.match(/[A-Z]/i)) {
            const index = Array.from(steckeredInputs).indexOf(input);
            const columnIndex = index % 32;
            const otherSteckeredIndex = index < 32 ? index + 32 : index - 32;
            const wheelPosInputs = document.querySelectorAll('.wheel-pos');
            const rotorSelects = [
                document.getElementById('fast-rotor'),
                document.getElementById('middle-rotor'),
                document.getElementById('slow-rotor')
            ];

            // Get rotor settings and positions for this column
            const rotors = rotorSelects.map(select => select.value);
            const positions = [
                wheelPosInputs[columnIndex].value,
                wheelPosInputs[columnIndex + 32].value,
                wheelPosInputs[columnIndex + 64].value
            ];

            // Perform Enigma encryption
            let encryptedLetter = enigmaEncrypt(letter, rotors, positions);

            // Update the other STECKERED input
            steckeredInputs[otherSteckeredIndex].value = encryptedLetter;
            let e = new Event('input');
            steckeredInputs[otherSteckeredIndex].dispatchEvent(e);

            saveState();
        }
    }

    const steckeredInputs = document.querySelectorAll('.steckered');
    steckeredInputs.forEach((input) => {
        // Add a keyup event listener for immediate keyboard input handling
        input.addEventListener('input', (event) => {
            if (event.key && event.key.length === 1 && event.key.match(/[a-z]/i)) {
                handleSteckeredInput(input, event.key.toUpperCase());
            }
        });

        // Add a MutationObserver to watch for all other changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                    handleSteckeredInput(input, input.value);
                }
            });
        });

        observer.observe(input, {
            attributes: true,
            attributeFilter: ['value'],
            characterData: true,
            subtree: true
        });
    });

    const resetPlugboardButton = document.getElementById('reset-plugboard');

    function setPlugboardStatus(message, color) {
        plugboardStatus.textContent = message;
        plugboardStatus.style.color = color;
    }

    function clearPlugboardStatus() {
        plugboardStatus.textContent = '';
        plugboardStatus.style.color = '';
    }

    function resetPlugboard() {
        // Clear plugboard table
        const plugboardRows = plugboardTable.rows;
        for (let row of plugboardRows) {
            row.cells[1].textContent = '';
            row.cells[2].textContent = '';
            row.style.backgroundColor = '';
        }

        // Clear STECKERED inputs
        const steckeredInputs = document.querySelectorAll('.steckered');
        steckeredInputs.forEach(input => {
            input.value = '';
        });

        // Reset small buttons
        const smallButtons = document.querySelectorAll('.small-button');
        smallButtons.forEach(button => {
            button.classList.remove('active');
            button.style.backgroundColor = '#ddd';
        });

        clearPlugboardStatus();
        // Save the reset state
        saveState();
    }

    // Add event listener for RESET button
    resetPlugboardButton.addEventListener('click', resetPlugboard);

});