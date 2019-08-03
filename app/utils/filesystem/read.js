const fs = require("fs");

export const readFiles = (filePathsArray) => {
    return filePathsArray.map(path => {
        console.log('about to read file')
        const file = fs.readFileSync(path, 'utf8')
        console.log('read file')
        return file
    })
}



// -------------------------------------------
// Helper methods

const formatFilePath = (filePath: string) =>
    `"${filePath.replace(/\\/g, "/")}"`;
