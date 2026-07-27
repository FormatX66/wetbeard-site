import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for (const file of ['api.php','admin.php']) await copyFile(file,`dist/${file}`);
