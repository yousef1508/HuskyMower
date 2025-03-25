// Database migration to add mower_serial_number column to notes table
import pg from 'pg';
const { Client } = pg;

async function main() {
  // Connect to the database using the DATABASE_URL environment variable
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting migration to add mower_serial_number column to notes table...');
    
    await client.connect();
    console.log('Connected to database');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notes' AND column_name = 'mower_serial_number';
    `;
    
    const columnExists = await client.query(checkColumnQuery);
    
    if (columnExists.rows.length === 0) {
      // Add the column if it doesn't exist
      console.log('Column does not exist, creating it now...');
      const addColumnQuery = `
        ALTER TABLE notes
        ADD COLUMN mower_serial_number TEXT;
      `;
      
      await client.query(addColumnQuery);
      console.log('Successfully added mower_serial_number column to notes table');
    } else {
      console.log('Column mower_serial_number already exists, no changes needed');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
    console.log('Database connection closed');
    process.exit(0);
  }
}

main();