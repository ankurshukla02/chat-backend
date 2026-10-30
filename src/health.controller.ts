const createHealthController = () => ({
  check: () => ({ status: 'ok', timestamp: new Date().toISOString() }),
});

export { createHealthController };
