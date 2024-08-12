document.addEventListener('DOMContentLoaded', function() {
    const bombeSimulator = document.getElementById('bombe-simulator');
    const plugboardTable = document.querySelector('#plugboard table');
    const fastRotorSelect = document.getElementById('fast-rotor');
    const middleRotorSelect = document.getElementById('middle-rotor');
    const slowRotorSelect = document.getElementById('slow-rotor');
    const advanceRotorsButton = document.getElementById('advance-rotors');
    const solvePlugboardButton = document.getElementById('solve-plugboard');
    const runBombeButton = document.getElementById('run-bombe');

    const plugboardStatus = document.getElementById('plugboard-status');

    const fastInitialSetting = document.getElementById('fast-rotor-initial');
    const midInitialSetting = document.getElementById('mid-rotor-initial');
    const slowInitialSetting = document.getElementById('slow-rotor-initial');

    const ROTOR_WIRINGS = {
        'I': 'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
        'II': 'AJDKSIRUXBLHWTMCQGZNPYFVOE',
        'III': 'BDFHJLCPRTXVZNYEIWGAKMUSQO',
        'IV': 'ESOVPZJAYQUIRHXLNFTGKDCMWB',
        'V': 'VZBRGITYUPSDNHLXAWMJQOFECK'
    };

    const ROTOR_NOTCHES = {
        'I': 'Q',
        'II': 'E',
        'III': 'V',
        'IV': 'J',
        'V': 'Z'
    };

    const REFLECTOR = 'YRUHQSLDPXNGOKMIEBFZCWVJAT'

    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';


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
        label.style.gridColumn = String(1);
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
            element.style.gridColumn = String(i + 2); // +2 because the first column is for labels
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
        label.textContent = 'SCRAMBLER'.split("")./*sort(() => 0.5 - Math.random()).*/join("") + ' ' + String(i + 1).padStart(2, '0');
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

        cellNumber.textContent = String(i);
        cellLetter1.textContent = '';
        cellLetter2.textContent = '';

        if (i<7) {
            const unsteckeredNo = row.insertCell(3);
            unsteckeredNo.textContent = String(i);
            const unsteckered1 = row.insertCell(4);
            const unsteckered2 = row.insertCell(5);
            unsteckered1.textContent = '';
            unsteckered2.textContent = '';
        }
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
        if (plugboardStatus.textContent !== '')
            return;
        const existingPair = findExistingPair(letter1, letter2);
        let inconsistent = false;
        if (existingPair) {
            if ((existingPair[0].textContent === letter1 && existingPair[1].textContent === letter2) ||
                (existingPair[0].textContent === letter2 && existingPair[1].textContent === letter1)) {
                return; // Do nothing if the pair already exists
            } else {
                existingPair[0].style.backgroundColor = 'yellow';
                existingPair[1].style.backgroundColor = 'yellow';
                setPlugboardStatus('INCONSISTENT', 'red');
                inconsistent = true;
            }
        }

        let emptyRow, firstCell, secondCell;
        if (letter1 === letter2) {
            firstCell = 4;
            secondCell = 5;
        }
        else {
            firstCell = 1;
            secondCell = 2;
        }
        emptyRow = Array.from(plugboardTable.rows).find(row =>
          (row.cells[firstCell] !== undefined) && !row.cells[firstCell].textContent);

        if (emptyRow) {
            emptyRow.cells[firstCell].textContent = letter1;
            emptyRow.cells[secondCell].textContent = letter2;
            if (inconsistent) {
                emptyRow.cells[firstCell].style.backgroundColor = 'yellow';
                emptyRow.cells[secondCell].style.backgroundColor = 'yellow';
            }
        } else {
            if (letter1 === letter2) {
                setPlugboardStatus('TOO MANY UNPAIRED', 'red');
            }
            else{
                setPlugboardStatus('TOO MANY PAIRS', 'red');
            }
        }
    }

    function findExistingPair(letter1, letter2) {
        for (let row of plugboardTable.rows) {
            for (let cell of row.cells) {
                if (cell.textContent === letter1 || cell.textContent === letter2) {
                    if (cell.cellIndex < 4) {
                        return [row.cells[1], row.cells[2]];
                    }
                    return [row.cells[4], row.cells[5]];
                }
            }
        }
        return null;
    }

    function updateWheelPositions() {
        let fastSetting = fastInitialSetting.value;
        let midSetting = midInitialSetting.value;
        let slowSetting = slowInitialSetting.value;
        let initialSetting = fastSetting + midSetting + slowSetting;

        if (initialSetting.length === 3) {
            const wheelPosInputs = document.querySelectorAll('.wheel-pos');
            wheelPosInputs[0].value = fastSetting;
            wheelPosInputs[32].value = midSetting;
            wheelPosInputs[64].value = slowSetting;

            for (let i = 1; i < 32; i++) {
                let settings = [];
                for (let j = 0; j < 3; j++) {
                    settings[j] = wheelPosInputs[i-1 + j*32].value
                }
                settings = stepRotors(settings[0], settings[1], settings[2]);
                for (let j = 0; j < 3; j++) {
                    wheelPosInputs[i + j * 32].value = settings[j];
                }
            }
        }
    }

    fastRotorSelect.addEventListener('change', function () {
        updateWheelPositions();
    });
    middleRotorSelect.addEventListener('change', function () {
        updateWheelPositions();
    });
    slowRotorSelect.addEventListener('change', function () {
        updateWheelPositions();
    });

    function stepRotors(fastPos, midPos, slowPos) {
        const rotorSelects = [
          document.getElementById('fast-rotor'),
          document.getElementById('middle-rotor'),
          document.getElementById('slow-rotor')
        ];

        // Get rotor settings and positions for this column
        const rotors = rotorSelects.map(select => select.value);

        if (midPos === ROTOR_NOTCHES[rotors[1]]) {
            // This is the extra step.
            midPos = caesar(midPos, 'A', 'B');
            // The slow wheel steps normally when
                // the middle wheel reaches its notch.
            slowPos = caesar(slowPos, 'A', 'B');
        }

        if(fastPos === ROTOR_NOTCHES[rotors[0]]) {
            // This is normal middle wheel rotation.
            midPos = caesar(midPos, 'A', 'B');
        }

        // Fast rotor always steps.
        fastPos = caesar(fastPos, 'A', 'B');

        return [fastPos, midPos, slowPos];
    }

    // Function to advance rotors
    function advanceRotors() {
        fastInitialSetting.value = caesar(fastInitialSetting.value, 'A', 'B');
        if(fastInitialSetting.value === 'A') {
            midInitialSetting.value = caesar(midInitialSetting.value, 'A', 'B');
            if(midInitialSetting.value === 'A') {
                slowInitialSetting.value = caesar(slowInitialSetting.value, 'A', 'B');
            }
        }
        saveState();
        updateWheelPositions();
    }

    function  frequencyMap (arr) {
        return arr.reduce((acc, curr) => {
            acc[curr] = (acc[curr] || 0) + 1;
            return acc;
        }, {});
    }

    function  mostFrequent(frequencyMap) {
        let maxCount = 0;
        let mostFrequentElement;
        for (const [element, count] of Object.entries(frequencyMap)) {
            if (count > maxCount) {
                maxCount = count;
                mostFrequentElement = element;
            }
        }
        return mostFrequentElement;
    }

    function solvePlugboardValues(plugboard) {
        const plaintext = Array.from(document.querySelectorAll('.plaintext')).map(input => input.value);
        const ciphertext = Array.from(document.querySelectorAll('.ciphertext')).map(input => input.value);

        const unsolved = (plaintext.concat(ciphertext)).filter(function (letter){
            return isLetter(letter) && !plugboard.has(letter);
        });

        if (unsolved.length === 0) {
            return plugboard;
        }

        let map = frequencyMap(unsolved);
        let L = mostFrequent(map);

        const rotorSelects = [
            document.getElementById('fast-rotor'),
            document.getElementById('middle-rotor'),
            document.getElementById('slow-rotor')
        ];
        const wheelPosInputs = document.querySelectorAll('.wheel-pos');

        function checkPlugboard(plugs, pair) {
            if(plugs.has(pair[0]) || plugs.has(pair[1])) {
                if(plugs.get(pair[0]) === pair[1]) {
                    return plugs;
                }
                return undefined;
            }
            plugs.set(pair[0], pair[1]);
            plugs.set(pair[1], pair[0]);
            return plugs;
        }

        function reachSteadyState(plugs) {
            let pl = new Map(plugs);
            let prevSize;
            do {
                prevSize = pl.size;
                pl = propagatePlugboard(pl, plaintext, ciphertext);
                if (pl === undefined) {
                    return undefined;
                }
                pl = propagatePlugboard(pl, ciphertext, plaintext);
                if (pl === undefined) {
                    return undefined;
                }
            } while (pl.size !== prevSize);
            return pl;
        }

        function propagatePlugboard(pl, side1, side2) {
            for (let j=0; j<32; j++) {
                const positions = [
                    wheelPosInputs[j].value,
                    wheelPosInputs[j + 32].value,
                    wheelPosInputs[j + 64].value
                ];
                if (pl.has(side1[j])) {
                    let sc = pl.get(side1[j]);
                    let sp = enigmaEncrypt(sc, rotors, positions);
                    pl = checkPlugboard(pl, [sp, side2[j]]);
                }
                if (pl === undefined) {
                    return undefined;
                }
            }
            return pl;
        }

        const rotors = rotorSelects.map(select => select.value);

        for (let p of ALPHABET) {
            if (plugboard.has(p)) { continue; }

            // pair L with p and reach steady state
            let tempPlugboard = new Map(plugboard);
            tempPlugboard.set(p, L);
            tempPlugboard.set(L, p);

            tempPlugboard = reachSteadyState(tempPlugboard);
            if(tempPlugboard !== undefined) {
                tempPlugboard = solvePlugboardValues(tempPlugboard);
                if(tempPlugboard !== undefined) {
                    return tempPlugboard;
                }
            }
        }
        return undefined;
    }

    function mapToPlugboard(plugboard) {
        if (plugboard === undefined) {
            return;
        }
        for (let entry of plugboard) {
            updatePlugboard(entry[0], entry[1]);
        }
    }

    function solvePlugboard() {
        let PLUGBOARD = solvePlugboardValues(new Map());
        // Copy solution to input cells
        mapToPlugboard(PLUGBOARD);
        if (PLUGBOARD !== undefined) {
            setPlugboardStatus("SOLVED", 'green');
        }
        else {
            setPlugboardStatus("NO SOLUTION", 'red');
        }

        return false;
    }

    async function runBombe() {
        resetPlugboard();
        let pl;
        for (let i=0; i<17576; i++) {
            // await new Promise(r => setTimeout(r, 0.001));
            advanceRotors();
            pl = solvePlugboardValues(new Map());
            if (pl !== undefined) {
                mapToPlugboard(pl);
                setPlugboardStatus("STOP FOUND", 'green');
                return;
            }
        }
        setPlugboardStatus("NO STOP FOUND", 'red');
    }

    // Add event listener for ADVANCE ROTORS button
    advanceRotorsButton.addEventListener('click', advanceRotors);
        // Add event listener for ADVANCE ROTORS button
    solvePlugboardButton.addEventListener('click', solvePlugboard);
    runBombeButton.addEventListener('click', runBombe);


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

    function caesar(letter, from, to) {
        const n = ALPHABET.length;
        const fromIndex = ALPHABET.indexOf(from.toUpperCase());
        const toIndex = ALPHABET.indexOf(to.toUpperCase());

        if (fromIndex === -1 || toIndex === -1) {
            throw new Error("Both FROM and TO letters must be in the alphabet");
        }

        let offset = (toIndex - fromIndex + n) % n;
        let shiftedAlphabet = ALPHABET.slice(offset) + ALPHABET.slice(0, offset);
        return shiftedAlphabet[ALPHABET.indexOf(letter)];
    }

    function reflector(letter) {
        const index = REFLECTOR.indexOf(letter);
        return ALPHABET[index];
    }

    function reverse(letter, ROTOR) {
        const index = ROTOR_WIRINGS[ROTOR].indexOf(letter);
        return ALPHABET[index];
    }

    function forward(letter, ROTOR) {
        const index = ALPHABET.indexOf(letter);
        return ROTOR_WIRINGS[ROTOR][index];
    }

    function enigmaEncrypt(letter, rotors, positions) {
        // Implement the full Enigma encryption process here
        positions = stepRotors(positions[0], positions[1], positions[2]);
        let result;

        // Forward through rotors
        result = caesar(letter, 'A', positions[0]);
        result = forward(result, rotors[0]);
        result = caesar(result, positions[0], positions[1]);
        result = forward(result, rotors[1]);
        result = caesar(result, positions[1], positions[2]);
        result = forward(result, rotors[2]);
        result = caesar(result, positions[2], 'A');

        result = reflector(result);

        result = caesar(result, 'A', positions[2]);
        result = reverse(result, rotors[2]);
        result = caesar(result, positions[2], positions[1]);
        result = reverse(result, rotors[1]);
        result = caesar(result, positions[1], positions[0]);
        result = reverse(result, rotors[0]);
        result = caesar(result, positions[0], 'A');

        // console.log('Rotor ' + rotors[i] + ' translated ' + before + ' to ' + result);
        // console.log('Reflector ' + 'translated ' + before + ' to ' + result);
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

            // Perform Enigma encryption and
            // update the other STECKERED input
            steckeredInputs[otherSteckeredIndex].value =
              enigmaEncrypt(letter, rotors, positions);

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

    function isLetter(c) {
        return c.toLowerCase() !== c.toUpperCase();
    }

    function resetPlugboard() {
        // Clear plugboard table
        const plugboardRows = plugboardTable.rows;
        for (let row of plugboardRows) {
            for (let cell of row.cells) {
                if(isLetter(cell.textContent)) {
                    cell.textContent = '';
                    cell.style.backgroundColor = '';
                }
            }
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