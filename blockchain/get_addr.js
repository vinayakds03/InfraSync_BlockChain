const fs = require('fs');
try {
  const content = fs.readFileSync('deployed2.txt', 'utf16le');
  const match = content.match(/TenderSystem deployed to:\s*(0x[a-fA-F0-9]{40})/);
  if (match) {
    console.log(match[1]);
  } else {
    console.log("NOT_FOUND");
  }
} catch(e) {
  console.log(e.message);
}
