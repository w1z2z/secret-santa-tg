import mongoose, { ConnectOptions } from 'mongoose';

import config from './config';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions);
    console.log('Подключение к MongoDB установлено');
  } catch (error: any) {
    console.error('Ошибка подключения к MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;
