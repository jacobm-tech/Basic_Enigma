function solvePlugboardValues(plugboard, plaintext, ciphertext, rotors, wheelPos) {
    const unsolved = (plaintext.concat(ciphertext)).filter(function (letter){
        return isLetter(letter) && !plugboard.has(letter);
    });

    if (unsolved.length === 0) {
        return plugboard;
    }

    const map = frequencyMap(unsolved);
    const L = mostFrequent(map);

    const possibleBoards = new Array(0);
    for (const p of ALPHABET) {
        if (plugboard.has(p)) { continue; }

        // pair L with p and reach steady state
        let tempPlugboard = new Map(plugboard);
        tempPlugboard.set(p, L);
        tempPlugboard.set(L, p);

        tempPlugboard = reachSteadyState(tempPlugboard, plaintext, ciphertext, rotors, wheelPos);
        if(tempPlugboard !== undefined) {
            tempPlugboard = solvePlugboardValues(tempPlugboard, plaintext, ciphertext, rotors, wheelPos);
            if(tempPlugboard !== undefined) {
                possibleBoards.push(tempPlugboard);
            }
        }
    }
    if (possibleBoards.length > 0) {
        return mergePlugboards(possibleBoards);
    }
    return undefined;
}

function mergePlugboards(plboards) {
    const merged = new Map();
    const allSolvedLetters = new Set(
        plboards.flatMap(m => Array.from(m.keys()))
        );
    for (const letter of allSolvedLetters) {
        const values = plboards
          .filter(m => m.has(letter)) //only maps with this key
          .map(m => m.get(letter));
        const v = new Set(values);
        if(v.size === 1 && values.length === plboards.length) {
            merged.set(letter, values[0]);
            merged.set(values[0], letter);
        }
    }
    return merged;
}

function checkPlugboard(plugs, pair) {
    if(plugs.has(pair[0]) || plugs.has(pair[1])) {
        if(plugs.get(pair[0]) === pair[1]) {
            return plugs;
        }
        return undefined;
    }
    plugs.set(pair[0], pair[1]);
    plugs.set(pair[1], pair[0]);

    // We will disallow plugboards with more than 6 unpaired letters
    // or more than 20 paired letters.
    const nUnpaired = [...plugs].filter(x => x[0] === x[1]).length;
    if (nUnpaired > 6 || plugs.size - nUnpaired > 20) {
        return undefined;
    }
    return plugs;
}

function reachSteadyState(plugs, plaintext, ciphertext, rotors, wheelPos) {
    let pl = new Map(plugs);
    let prevSize;
    do {
        prevSize = pl.size;
        pl = propagatePlugboard(pl, plaintext, ciphertext, rotors, wheelPos);
        if (pl === undefined) {
            return undefined;
        }
        pl = propagatePlugboard(pl, ciphertext, plaintext, rotors, wheelPos);
        if (pl === undefined) {
            return undefined;
        }
    } while (pl.size !== prevSize);
    return pl;
}

function propagatePlugboard(pl, side1, side2, rotors, wheelPos) {
    for (let j=0; j<32; j++) {
        const positions = [
            wheelPos[j],
            wheelPos[j + 32],
            wheelPos[j + 64]
        ];
        if (pl.has(side1[j])) {
            const sc = pl.get(side1[j]);
            const sp = enigmaEncrypt(sc, rotors, positions);
            pl = checkPlugboard(pl, [sp, side2[j]]);
        }
        if (pl === undefined) {
            return undefined;
        }
    }
    return pl;
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