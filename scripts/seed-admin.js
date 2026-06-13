const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveUsers(users) {
  initDB();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function getUsers() {
  initDB();
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
}

function seedAdmin(username, password) {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  
  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = {
    username,
    passwordHash,
    role: 'admin'
  };

  if (existingIndex >= 0) {
    users[existingIndex] = newUser;
    console.log(`Updated existing user "${username}" to admin status with new password.`);
  } else {
    users.push(newUser);
    console.log(`Successfully created new admin user "${username}".`);
  }

  saveUsers(users);
}

// Main execution flow
const args = process.argv.slice(2);
let username = args[0] || process.env.ADMIN_USERNAME;
let password = args[1] || process.env.ADMIN_PASSWORD;

if (username && password) {
  seedAdmin(username, password);
  process.exit(0);
}

// Interactive prompt if not supplied via command line or env variables
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('Enter desired admin username: ', (enteredUsername) => {
  if (!enteredUsername.trim()) {
    console.error('Username cannot be empty.');
    readline.close();
    process.exit(1);
  }
  
  readline.question('Enter desired admin password: ', (enteredPassword) => {
    if (!enteredPassword.trim()) {
      console.error('Password cannot be empty.');
      readline.close();
      process.exit(1);
    }
    
    seedAdmin(enteredUsername.trim(), enteredPassword.trim());
    readline.close();
  });
});
