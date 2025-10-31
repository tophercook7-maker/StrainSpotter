// Script to create two admin users in Supabase
import { supabaseAdmin } from '../supabaseAdmin.js';

async function createAdminUser(email, username, password) {
  // Create user in Supabase Auth
  const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username }
  });
  if (authError) {
    console.error(`Error creating auth user for ${email}:`, authError.message);
    return;
  }
  const userId = user.user.id;
  // Insert into users table with admin role
  const { error: dbError } = await supabaseAdmin.from('users').insert({
    id: userId,
    email,
    username,
    role: 'admin',
    created_at: new Date().toISOString()
  });
  if (dbError) {
    console.error(`Error inserting user record for ${email}:`, dbError.message);
    return;
  }
  console.log(`Admin user created: ${email} (${username})`);
}

async function main() {
  await createAdminUser('topher.cook7@gmail.com', 'KING123', 'KING123');
  await createAdminUser('andrewbeck209@gmail.com', 'andrewbeck209', 'KING123');
  console.log('Admin user creation complete.');
}

main();
