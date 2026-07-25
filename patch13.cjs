const fs = require('fs');
let code = fs.readFileSync('src/entities/user/userStore.ts', 'utf8');

const target1 = `  blockedLogins: string[];`;
const replacement1 = `  blockedLogins: string[];\n  blockedByLogins: string[];`;

const target2 = `    blockedLogins: [],`;
const replacement2 = `    blockedLogins: [],\n    blockedByLogins: [],`;

const target3 = `            blockedLogins: data.blockedLogins || []`;
const replacement3 = `            blockedLogins: data.blockedLogins || [],\n            blockedByLogins: data.blockedByLogins || []`;

code = code.replace(target1, replacement1);
code = code.replace(target2, replacement2);
code = code.replace(target3, replacement3);

fs.writeFileSync('src/entities/user/userStore.ts', code);
