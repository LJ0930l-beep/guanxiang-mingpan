const storage = new Map();

const AsyncStorage = {
  async getItem(key) {
    return storage.get(key) ?? null;
  },
  async setItem(key, value) {
    storage.set(key, value);
  },
  async removeItem(key) {
    storage.delete(key);
  },
  async multiSet(entries) {
    entries.forEach(([key, value]) => storage.set(key, value));
  },
  async multiRemove(keys) {
    keys.forEach((key) => storage.delete(key));
  },
};

export { storage as __storage };
export default AsyncStorage;
