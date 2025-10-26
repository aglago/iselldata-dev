const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Use service role key for admin operations, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey
);

async function resetAdminPassword() {
  try {
    // Test connection first
    console.log('🔗 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('admin_users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError.message);
      console.log('💡 Try adding SUPABASE_SERVICE_ROLE_KEY to your .env file');
      return;
    }
    
    console.log('✅ Connected to Supabase successfully');
    
    // Prompt for new password
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const askQuestion = (question) => {
      return new Promise(resolve => {
        rl.question(question, resolve);
      });
    };

    console.log('🔐 Admin Password Reset Script');
    console.log('================================');
    
    const email = await askQuestion('Enter admin email to reset password for: ');
    const newPassword = await askQuestion('Enter new password: ');
    const confirmPassword = await askQuestion('Confirm new password: ');

    if (newPassword !== confirmPassword) {
      console.log('❌ Passwords do not match!');
      rl.close();
      return;
    }

    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long!');
      rl.close();
      return;
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update the admin user in database
    const { data, error } = await supabase
      .from('admin_users')
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('❌ Error updating password:', error);
      rl.close();
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ Admin user not found with email:', email);
      rl.close();
      return;
    }

    console.log('✅ Password updated successfully!');
    console.log('📧 Admin user:', data[0].email);
    console.log('👤 Name:', data[0].name);
    console.log('');
    console.log('You can now login with your new password.');

    rl.close();
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
resetAdminPassword();