const fs = require('fs');
let code = fs.readFileSync('src/entities/chat/chatStore.ts', 'utf8');

const target = `    } catch (e) {
      console.error('Failed to clear direct messages:', e);
    }`;
    
const replacement = `    } catch (e) {
      console.error('Failed to clear direct messages:', e);
    }`;

console.log(code.includes(target));
