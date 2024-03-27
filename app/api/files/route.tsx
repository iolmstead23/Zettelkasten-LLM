import { NextResponse } from 'next/server'
import fsPromises from 'fs/promises';
//import fs from 'fs';
import path from 'path';
//import matter from 'gray-matter';
 
export async function GET(request: Request) {

    //const fileNames = fs.readdirSync("/notes");
    
    //const allNotesData = fileNames.map((fileName) => {
        // Remove ".md" from file name to get id
    //    const id = fileName.replace(/\.md$/, '');
        
        // Read markdown file as string
    //    const fullPath = path.join("/", fileName);
    //    const fileContents = fs.readFileSync(fullPath, 'utf8');
        
        // Use gray-matter to parse the post metadata section
    //    const matterResult = matter(fileContents);
        
        // Combine the data with the id
    //    return {
    //        id,
    //        ...matterResult.data,
    //    };
    //})

    try {
        const filePath = path.join(process.cwd(), 'public/data.json');
        const jsonData = (await fsPromises.readFile(filePath)).toString();
        const objectData = JSON.parse(jsonData);
        return NextResponse.json(objectData)
    } catch(e) {
        console.log("Error loading JSON data: ", e)
    }
}