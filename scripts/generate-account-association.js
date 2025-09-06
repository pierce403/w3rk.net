// Script to generate Farcaster account association
// This is a placeholder - you'll need to run this through Farcaster's developer tools

console.log('📋 Steps to generate Farcaster Account Association:');
console.log('');
console.log('1. Go to: https://farcaster.xyz/~/settings/developer-tools');
console.log('2. Enable Developer Mode');
console.log('3. Use the Account Association tool to generate credentials');
console.log('4. Copy the header, payload, and signature values');
console.log('5. Update public/.well-known/farcaster.json with these values');
console.log('');
console.log('Current manifest location: https://w3rk.net/.well-known/farcaster.json');
console.log('');
console.log('The accountAssociation section should look like this:');
console.log(JSON.stringify({
  "accountAssociation": {
    "header": "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9",
    "payload": "eyJkb21haW4iOiJ3M3JrLm5ldCIsInRpbWVzdGFtcCI6MTcyNTU5MzY0Mn0",
    "signature": "your_signature_here"
  }
}, null, 2));

console.log('');
console.log('⚠️ IMPORTANT: Without a valid account association, the embed may not work properly.');
console.log('This links your Farcaster account to the w3rk.net domain.');
