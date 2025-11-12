const bcrypt = require('bcrypt');

async function generatePasswordHash() {
  // Get password from command line argument
  const password = process.argv[2];
  
  if (!password) {
    console.log('Usage: node generate-password-hash.js "your-new-password"');
    console.log('Example: node generate-password-hash.js "myNewPassword123"');
    return;
  }

  if (password.length < 6) {
    console.log('❌ Password must be at least 6 characters long!');
    return;
  }

  try {
    // Use same salt rounds as your existing system (12)
    const saltRounds = 12;
    console.log('🔐 Generating password hash...');
    
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Password hash generated successfully!');
    console.log('');
    console.log('Hash to update in database:');
    console.log(hashedPassword);
    console.log('');
    console.log('Update your admin_users table with:');
    console.log(`UPDATE admin_users SET password_hash = '${hashedPassword}' WHERE email = 'your-email@domain.com';`);
    
  } catch (error) {
    console.error('❌ Error generating hash:', error);
  }
}

generatePasswordHash();