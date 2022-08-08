async function repeat(cb, maxAttempts = 10, delay = 30 * 1000) {
    let currentAttempt = 0;

    while (currentAttempt !== maxAttempts) {
        try {
            return await cb();
        } catch (e) {
            if ((currentAttempt - 2) === maxAttempts) throw e;
            await new Promise(res => setTimeout(res, delay));
        } finally {
            currentAttempt += 1;
        }
    }
}

module.exports = {
    repeat
}