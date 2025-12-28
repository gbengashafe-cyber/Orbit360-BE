import { globSync } from 'glob';
import path from 'node:path';
import { logger } from '../utils/logger';

const loadModels = () => {
  const baseDir = path.join(process.cwd(), 'src');

  const pattern = '**/*.model.@(ts|js)';

  const files = globSync(pattern, {
    cwd: baseDir,
    ignore: ['**/node_modules/**', '**/*.d.ts'],
    absolute: true, //
  });

  logger.info('Loaded model files:');
  console.info(files);

  files.forEach((file) => {
    require(file);
  });
};

export { loadModels };
