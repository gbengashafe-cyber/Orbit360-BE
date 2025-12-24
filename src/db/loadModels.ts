import { globSync } from 'glob';
import path from 'node:path';

const loadModels = () => {
  const baseDir = path.join(process.cwd(), 'src');

  const pattern = '**/*.model.@(ts|js)';

  const files = globSync(pattern, {
    cwd: baseDir,
    ignore: ['**/node_modules/**', '**/*.d.ts'],
    absolute: true, //
  });

  console.log('Loaded model files:');
  console.log(files);

  files.forEach((file) => {
    require(file);
  });
};

export { loadModels };
