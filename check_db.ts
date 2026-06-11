import Database from "better-sqlite3";
const db = new Database("archive.db");
console.log("Documents Table Info:");
console.log(db.prepare("PRAGMA table_info(documents)").all());
console.log("\nFolders Table Info:");
console.log(db.prepare("PRAGMA table_info(folders)").all());
