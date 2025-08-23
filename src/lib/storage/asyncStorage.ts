import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage wrapper to match MMKV interface
export const storage = {
  set: async (key: string, value: string | number | boolean) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  
  getString: async (key: string): Promise<string | undefined> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        const parsed = JSON.parse(value);
        return typeof parsed === 'string' ? parsed : undefined;
      }
      return undefined;
    } catch (error) {
      console.error('Storage getString error:', error);
      return undefined;
    }
  },
  
  getNumber: async (key: string): Promise<number | undefined> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        const parsed = JSON.parse(value);
        return typeof parsed === 'number' ? parsed : undefined;
      }
      return undefined;
    } catch (error) {
      console.error('Storage getNumber error:', error);
      return undefined;
    }
  },
  
  getBoolean: async (key: string): Promise<boolean | undefined> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        const parsed = JSON.parse(value);
        return typeof parsed === 'boolean' ? parsed : undefined;
      }
      return undefined;
    } catch (error) {
      console.error('Storage getBoolean error:', error);
      return undefined;
    }
  },
  
  delete: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage delete error:', error);
    }
  },
  
  clearAll: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Storage clearAll error:', error);
    }
  },
  
  getAllKeys: async (): Promise<readonly string[]> => {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  },
};

export const tokenStorage = {
  getItem: async (key: string) => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('Token storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Token storage setItem error:', error);
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Token storage removeItem error:', error);
    }
  },
};