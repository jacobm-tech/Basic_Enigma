document.addEventListener('DOMContentLoaded', function() {
    const bombeSimulator = document.getElementById('bombe-simulator');
    const plugboardTable = document.querySelector('#plugboard table');
    const fastRotorSelect = document.getElementById('fast-rotor');
    const middleRotorSelect = document.getElementById('middle-rotor');
    const slowRotorSelect = document.getElementById('slow-rotor');
    const advanceRotorsButton = document.getElementById('advance-rotors');

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
        input.addEventListener('keydown', function(e) {
            if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
                e.preventDefault();
                this.value = e.key.toUpperCase();
                if (index < allInputs.length - 1) {
                    allInputs[index + 1].focus();
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
                alert('Inconsistent Plugboard Setting');
                return;
            }
        }

        const emptyRow = Array.from(plugboardTable.rows).find(row => !row.cells[1].textContent);
        if (emptyRow) {
            emptyRow.cells[1].textContent = letter1;
            emptyRow.cells[2].textContent = letter2;
            highlightPlugboardRow(emptyRow);
        } else {
            alert('Plugboard Full');
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

    // Function to advance rotors
    function advanceRotors() {
        const initialSettingInputs = document.querySelectorAll('.initial-setting');
        let setting = Array.from(initialSettingInputs).map(input => input.value).join('');
        setting = incrementSetting(setting, 1);
        for (let i = 0; i < 3; i++) {
            initialSettingInputs[i].value = setting[i];
        }
        saveState();
        updateWheelPositions();
    }

    // Add event listener for ADVANCE ROTORS button
    advanceRotorsButton.addEventListener('click', advanceRotors);

    function saveState() {
        console.log('Saving state...'); // Debug log
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
        console.log('State saved:', state); // Debug log
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
        // This is a simple reflector (ETW). You might want to implement a more complex one.
        const index = (ALPHABET.indexOf(letter) + 13) % 26;
        return ALPHABET[index];
    }

    function enigmaEncrypt(letter, rotors, positions) {
        // Implement the full Enigma encryption process here
        let result = letter;

        // Forward through rotors
        for (let i = 2; i >= 0; i--) {
            const offset = ALPHABET.indexOf(positions[i]);
            const shiftedAlphabet = ALPHABET.slice(offset) + ALPHABET.slice(0, offset);
            result = rotorForward(result, ROTOR_WIRINGS[rotors[i]]);
            result = ALPHABET[shiftedAlphabet.indexOf(result)];
        }

        // Reflector
        result = reflector(result);

        // Backward through rotors
        for (let i = 0; i < 3; i++) {
            const offset = ALPHABET.indexOf(positions[i]);
            const shiftedAlphabet = ALPHABET.slice(offset) + ALPHABET.slice(0, offset);
            result = shiftedAlphabet[ALPHABET.indexOf(result)];
            result = rotorReverse(result, ROTOR_WIRINGS[rotors[i]]);
        }

        return result;
    }

    // Update the event listeners for STECKERED inputs
    const steckeredInputs = document.querySelectorAll('.steckered');
    steckeredInputs.forEach((input, index) => {
        input.addEventListener('change', function() {
            if (this.value.length === 1 && this.value.match(/[A-Z]/i)) {
                const letter = this.value.toUpperCase();
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
                const encryptedLetter = enigmaEncrypt(letter, rotors, positions);

                // Update the other STECKERED input
                steckeredInputs[otherSteckeredIndex].value = encryptedLetter;

                saveState();
            }
        });
    });
});