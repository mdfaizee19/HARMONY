import fs from 'fs';
import { processSimulation } from './engine.js';

const readInput = () => {
    try {
        // Attempt to read from stdin
        const fd = process.stdin.fd;
        const input = fs.readFileSync(fd, 'utf-8');
        if (!input) {
            throw new Error("Empty input");
        }
        return JSON.parse(input);
    } catch (err) {
        // If stdin fails/empty, we can check arguments, but for "pure function" engine
        // usually stdin is the way.
        // However, if run without input, it hangs on readFileSync?
        // Node.js fs.readFileSync(0) blocks.
        // We assume the caller pipes input.
        // If error parsing, we must handle it.
        console.error(JSON.stringify({ error: "Invalid Input", details: err.message }));
        process.exit(1);
    }
};

const main = () => {
    try {
        const input = readInput();
        const output = processSimulation(input);
        console.log(JSON.stringify(output, null, 2));
    } catch (error) {
        // Start strictly compliant: "NEVER output anything except valid JSON"
        // So even crashes should be JSON.
        console.error(JSON.stringify({
            error: "Simulation Failed",
            details: error.message,
            stack: error.stack
        }));
        process.exit(1);
    }
};

main();
