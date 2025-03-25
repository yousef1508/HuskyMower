-- Add missing column to the notes table
DO $$ 
BEGIN 
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'notes' 
        AND column_name = 'mower_serial_number'
    ) THEN 
        -- Add the column
        ALTER TABLE notes ADD COLUMN mower_serial_number TEXT;
        RAISE NOTICE 'Added mower_serial_number column to notes table';
    ELSE
        RAISE NOTICE 'Column mower_serial_number already exists in notes table';
    END IF;
END $$;