import { createWriteStream } from "fs";


//used to create PDFs and store them in the waybills folder
export async function storePDF(name, base64) {
    try {
        const s = Buffer.from(base64, "base64");
        const writeStream = createWriteStream(process.cwd()+"/waybills/"+name+".pdf");
        writeStream.write(s);
        writeStream.end();
        return "success"
    } catch(e) {
        console.error(e);
        return "fail";
    }
}