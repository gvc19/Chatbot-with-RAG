export const logger = {
  info(message, meta = {}) {
    // Simple structured logger; can be replaced with Winston/Pino in real prod
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        time: new Date().toISOString(),
        ...meta
      })
    );
  },
  error(message, meta = {}) {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        time: new Date().toISOString(),
        ...meta
      })
    );
  },
  warn(message, meta = {}) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        message,
        time: new Date().toISOString(),
        ...meta
      })
    );
  }
};

