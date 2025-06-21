import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'scorekick-storage',
  encryptionKey: 'scorekick-secret-key',
});

export const tokenStorage = {
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  setItem: (key: string, value: string) => {
    storage.set(key, value);
  },
  removeItem: (key: string) => {
    storage.delete(key);
  },
};