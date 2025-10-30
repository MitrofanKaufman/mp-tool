const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { db } = require('../../config');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration(s) to run`);

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Running migration: ${file}`);
    
    try {
      // Read the SQL file
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Execute the SQL
      await db.raw(sql);
      console.log(`✅ Successfully ran migration: ${file}`);
    } catch (error) {
      console.error(`❌ Error running migration ${file}:`, error);
      process.exit(1);
    }
  }

  console.log('All migrations completed successfully');
  process.exit(0);
}

runMigrations().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});
