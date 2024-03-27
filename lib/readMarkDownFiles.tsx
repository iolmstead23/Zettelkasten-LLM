import fs from 'fs'
import path from 'path'

// Function to recursively read a directory and return all markdown files
function readMarkdownFiles(directory: string): string[] {
    let markdownFiles: string[] = [];
  
    const files = fs.readdirSync(directory);
  
    files.forEach((file) => {
        const filePath = path.join(directory, file);
        const fileStat = fs.statSync(filePath);
  
        if (fileStat.isDirectory()) {
            markdownFiles = markdownFiles.concat(readMarkdownFiles(filePath));
        } else if (path.extname(filePath) === '.md') {
            markdownFiles.push(filePath);
        }
    });
  
    return markdownFiles;
}

export default readMarkdownFiles