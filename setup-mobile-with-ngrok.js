const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('========================================');
console.log('Mobile App - ngrok Setup Helper');
console.log('========================================\n');

console.log('Instructions:');
console.log('1. Open a new terminal and run: ngrok http 5000');
console.log('2. Copy the "Forwarding" URL (e.g., https://xxxx-xxxx.ngrok-free.app)');
console.log('3. Paste it below\n');

rl.question('Enter your ngrok URL (without /api): ', (ngrokUrl) => {
    // Clean up the URL
    ngrokUrl = ngrokUrl.trim().replace(/\/$/, ''); // Remove trailing slash
    
    if (!ngrokUrl.startsWith('http')) {
        console.log('\n❌ Invalid URL! Must start with http:// or https://');
        rl.close();
        return;
    }

    const apiUrl = `${ngrokUrl}/api`;
    
    // Update mobile app config
    const configContent = `const NGROK_URL = "${apiUrl}";

export const API_URL = NGROK_URL;
export const BASE_URL = NGROK_URL;

console.log("API URL:", API_URL);
`;

    try {
        fs.writeFileSync('mobile-app/src/config.js', configContent);
        console.log('\n✅ Updated mobile-app/src/config.js');
        console.log(`   API URL: ${apiUrl}`);
        
        // Update admin dashboard .env
        const adminEnvContent = `VITE_API_URL=${apiUrl}`;
        fs.writeFileSync('admin-dashboard/.env', adminEnvContent);
        console.log('\n✅ Updated admin-dashboard/.env');
        console.log(`   API URL: ${apiUrl}`);
        
        console.log('\n========================================');
        console.log('Setup Complete!');
        console.log('========================================\n');
        
        console.log('Next steps:\n');
        console.log('For Admin Dashboard:');
        console.log('  cd admin-dashboard');
        console.log('  npm run dev');
        console.log('  Open: http://localhost:5173\n');
        
        console.log('For Mobile App:');
        console.log('  cd mobile-app');
        console.log('  npx expo start');
        console.log('  Scan QR code with Expo Go app\n');
        
        console.log('Login credentials:');
        console.log('  Email: admin@smartfuel.com');
        console.log('  Password: admin123\n');
        
    } catch (error) {
        console.error('\n❌ Error updating files:', error.message);
    }
    
    rl.close();
});
