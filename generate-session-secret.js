#!/usr/bin/env node

// Generate a secure session secret for Railway deployment
import { randomBytes } from 'crypto';

const sessionSecret = randomBytes(32).toString('hex');

console.log('\n🔑 Generated Session Secret for Railway:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(sessionSecret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nAdd this to your Railway environment variables:');
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log('\nThis secret is used for secure session encryption.');
console.log('Keep it private and never commit it to your repository.\n');