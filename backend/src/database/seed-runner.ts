import { AppDataSource } from './data-source';
import { seed } from './seed';

async function run() {
  try {
    await AppDataSource.initialize();
    console.log('Підключено до бази даних\n');
    await seed(AppDataSource);
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Помилка:', err);
    process.exit(1);
  }
}

run();
