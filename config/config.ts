import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const config:{MONGO_URI: string, TG_TOKEN: string} = {
  TG_TOKEN: process.env.TG_TOKEN || '',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017'
};

export default config;
