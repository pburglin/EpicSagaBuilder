-- Add cloned_from column to stories table
    ALTER TABLE stories ADD COLUMN cloned_from uuid REFERENCES stories(id);
