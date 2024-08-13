const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const request = new XMLHttpRequest();
request.open("GET","enigma_rotors.json", false);
request.send(null);
const ROTORS = JSON.parse(request.responseText);

function caesar(letter, from, to) {
    const n = ALPHABET.length;
    const fromIndex = ALPHABET.indexOf(from.toUpperCase());
    const toIndex = ALPHABET.indexOf(to.toUpperCase());

    if (fromIndex === -1 || toIndex === -1) {
        throw new Error("Both FROM and TO letters must be in the alphabet");
    }

    const offset = (toIndex - fromIndex + n) % n;
    const shiftedAlphabet = ALPHABET.slice(offset) + ALPHABET.slice(0, offset);
    return shiftedAlphabet[ALPHABET.indexOf(letter)];
}

function reflector(letter) {
    const index = ROTORS.REFLECTOR.WIRING.indexOf(letter);
    return ALPHABET[index];
}

function reverse(letter, ROTOR) {
    const index = ROTORS[ROTOR].WIRING.indexOf(letter);
    return ALPHABET[index];
}

function forward(letter, ROTOR) {
    const index = ALPHABET.indexOf(letter);
    return ROTORS[ROTOR].WIRING[index];
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

    return result;
}

function stepRotors(fastPos, midPos, slowPos) {
    const rotorSelects = [
      document.getElementById('fast-rotor'),
      document.getElementById('middle-rotor'),
      document.getElementById('slow-rotor')
    ];

    // Get rotor settings and positions for this column
    const rotors = rotorSelects.map(select => select.value);

    if (midPos === ROTORS[rotors[1]].NOTCH) {
        // This is the extra step.
        midPos = caesar(midPos, 'A', 'B');
        // The slow wheel steps normally when
            // the middle wheel reaches its notch.
        slowPos = caesar(slowPos, 'A', 'B');
    }

    if(fastPos === ROTORS[rotors[0]].NOTCH) {
        // This is normal middle wheel rotation.
        midPos = caesar(midPos, 'A', 'B');
    }

    // Fast rotor always steps.
    fastPos = caesar(fastPos, 'A', 'B');

    return [fastPos, midPos, slowPos];
}

function isLetter(c) {
    return c.toLowerCase() !== c.toUpperCase();
}