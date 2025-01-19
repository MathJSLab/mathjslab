/**
 * git-commit.cjs:
 */
const { exec } = require('node:child_process');

/* Default commit message. */
const defaultMessage = `Committed on ${new Date().toGMTString()}`;
/* Wait time in milliseconds (3 seconds). */
const timeoutDuration = 3000;

console.log(`Enter the commit message. [${defaultMessage}]:`);

let timeout;
let userInput = '';

/**
 * Function to execute the git commit command.
 * @param {*} message
 */
const executeCommit = (message) => {
    const commitMessage = message.trim() || defaultMessage;
    exec(`git commit -m "${commitMessage}"`, (err, stdout, stderr) => {
        if (err) {
            console.error(`Error: ${err.message}`);
            process.exit(1);
        }
        if (stderr) {
            console.error(`Git Output: ${stderr}`);
        }
        console.log(stdout);
        process.exit(0); // Finish the script.
    });
};

/* Set the timeout to use the default value. */
timeout = setTimeout(() => {
    console.log(`No input provided. Using default message: "${defaultMessage}"`);
    executeCommit(defaultMessage);
}, timeoutDuration);

/* Configure reading from stdin. */
process.stdin.setEncoding('utf8');
process.stdin.setRawMode(true); // Enables character-by-character reading.
process.stdin.resume();

/* Reads user input character by character. */
process.stdin.on('data', (char) => {
    if (char === '\r' || char === '\n') {
        /* Enter was pressed. */
        clearTimeout(timeout);
        process.stdin.setRawMode(false); // Restores default mode.
        process.stdin.pause(); // Pauses input to prevent further captures.
        executeCommit(userInput);
    } else if (char === '\u0003') {
        /* Ctrl+C was pressed. */
        console.log('^C\nOperation canceled.');
        process.exit(1);
    } else {
        /* Another character has been captured. */
        clearTimeout(timeout); // Cancel the timer.
        process.stdout.write(char); // Shows the character on the screen.
        userInput += char; // Adds the character to the message.
    }
});
