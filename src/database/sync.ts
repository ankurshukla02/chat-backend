import { initializeDatabase } from './data-source';

void initializeDatabase()
  .then(() => {
    console.log('Database synchronized successfully');
  })
  .catch((error) => {
    console.error('Database sync failed', error);
    process.exit(1);
  });
