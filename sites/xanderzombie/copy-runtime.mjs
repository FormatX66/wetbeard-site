import { copyFile, mkdir } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for (const file of ['comic-api.php','studio.php','reel.php','story-bible.json']) await copyFile(file,`dist/${file}`);
