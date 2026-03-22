-- Migration number: 0001 	 2024-03-22T00:01:00.000Z

-- Drop the prompt_used column from image_analysis
ALTER TABLE image_analysis DROP COLUMN prompt_used;
