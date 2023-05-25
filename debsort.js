// aiden@cmp.bz

function compareDebianVersions(a, b) {
    if (a == b) {
        return 0;
    }

    // Helper function to compare two numbers (like the `<=>` operator from other languages):
    const compare = (a, b) => Number(a != b && (a < b ? -1 : 1));
    // Helper function to make two arrays the same length by padding the right of the shorter array with empty strings:
    const ensureSameLength = (arr1, arr2) => {
        while (arr1.length < arr2.length) {
            arr1.push("");
        }
        while (arr2.length < arr1.length) {
            arr2.push("");
        }
    }

    /*
        Breaks a string into an object describing:
            - epoch
            - version
            - revision
        It's easier to work with.
    */
    let parseString = str => {
        // `epoch` and `revision` default to 0.
        let epoch = 0;
        if (str.includes(":")) {
            epoch = str.substring(0, str.indexOf(":"));
            epoch = parseInt(epoch);
        }
        
        let version = str.substr(str.indexOf(":") + 1);
        
        let revision = "0";
        let finalDash = version.lastIndexOf("-");
        if (finalDash != -1) {
            revision = version.substr(finalDash + 1);
            version = version.substring(0, finalDash);
        }

        if (!version) {
            throw new Error("`version` is not optional.");
        }

        return { epoch, version, revision };
    }
    a = parseString(a), b = parseString(b);

    // Compare `epoch`s.
    let epochResult = compare(a.epoch, b.epoch);
    if (epochResult != 0) {
        return epochResult;
    }

    // Function to break down a version string according to the spec (I think):
    const splitVersion = str => {
        if (!str) {
            return [""];
        }

        // `split` is the array that this function will return.
        // `splitIndex` is the current index in `split`.
        let split = [];
        let splitIndex = 0;

        /*
            `exps` is an array of two regular expressions.
            The first regex matches the allowed non-digit
            characters, and the second matches digits.
        */
        // `expsIndex` is the current index in `exps`.
        let exps = [/^[A-Z.\-+~]*$/i, /^[0-9]*$/];
        let expsIndex = Number(exps[1].test(str[0]));

        // Helper functions:
        let pushCharacter = char => {
            if (typeof split[splitIndex] != "string") split[splitIndex] = "";
            split[splitIndex] += char;
        }

        for (let char of str) {
            // Ensure that the character is valid.
            if (!/^[A-Z.\-+~0-9]*$/i.test(char)) {
                throw new Error("Bad character.");
            }

            // If the character doesn't match the selected regex...
            if (!exps[expsIndex].test(char)) {
                // Increase `splitIndex` to make a new string.
                splitIndex++;
                // Switch `expsIndex` (i.e. 1 becomes 0, 0 becomes 1).
                // This basically means that we select the unselected regex.
                expsIndex ^= 1;
            }

            pushCharacter(char);
        }

        // There may be empty slots in the array (`split`). The following code fills them with empty strings:
        for (let idx = 0; idx < split.length; ++idx) {
            if (typeof split[idx] == "undefined") {
                split[idx] = "";
            }
        }

        return split;
    }

    // Function to compare two strings according to the spec:
    const strcmp = (str1, str2) => {
        // According to the spec, we can't compare standard ASCII character codes.
        // This function returns more useful "character codes" according to the spec:
        const orderedCode = char => {
            // '~' before `undefined` before /^[0-9]$/ before /^[A-Z]$/i before '+' before '-' before '.' (I think.)

            let numbers = [];
            for (let idx = 0; idx <= 9; ++idx) {
                numbers.push(idx.toString());
            }

            let uppercaseAlphabet = [];
            for (let idx = "A".charCodeAt(0); idx <= "Z".charCodeAt(0); ++idx) {
                uppercaseAlphabet.push(String.fromCharCode(idx));
            }

            let lowercaseAlphabet = uppercaseAlphabet.map(e => e.toLowerCase());

            let characterArray = ["~", undefined, ...numbers, ...uppercaseAlphabet, ...lowercaseAlphabet, "+", "-", "."];

            return characterArray.indexOf(char);
        }

        for (let idx = 0; idx < Math.max(str1.length, str2.length); ++idx) {
            // Compare the result of `orderedCode` for both characters.
            let result = compare(orderedCode(str1[idx]), orderedCode(str2[idx]));
            if (!result) {
                continue;
            }
            return result;
        }

        return 0;
    }

    // Function to compare two parts:
    const compareParts = (part1, part2) => {
        // If both parts are numeric, compare as numbers.
        if (/^[0-9]+$/.test(part1) && /^[0-9]+$/.test(part2)) {
            part1 = parseInt(part1), part2 = parseInt(part2);
            return compare(part1, part2);
        }
        // Otherwise, use `strcmp`.
        return strcmp(part1, part2);
    }

    // `version` and `revision` are compared in the exact same way.

    for (let prop of ["version", "revision"]) {
        let array1 = splitVersion(a[prop]), array2 = splitVersion(b[prop]);
        ensureSameLength(array1, array2);

        for (let idx = 0; idx < array1.length; ++idx) {
            let result = compareParts(array1[idx], array2[idx]);
            if (!result) {
                continue;
            }
            return result;
        }
    }

    return 0;
}
