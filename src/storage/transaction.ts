export interface StorageTransactionAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export class StorageTransactionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageTransactionError';
  }
}

/**
 * Replace a group of local-storage keys atomically from the caller's point of
 * view. AsyncStorage has no multi-key transaction, so every failed write is
 * followed by a best-effort restore of the exact pre-import values.
 */
export async function transactionalReplace(
  entries: [string, string][],
  adapter: StorageTransactionAdapter,
): Promise<void> {
  const keys = [...new Set(entries.map(([key]) => key))];
  const previous = new Map<string, string | null>();
  for (const key of keys) previous.set(key, await adapter.getItem(key));

  try {
    for (const [key, value] of entries) await adapter.setItem(key, value);
  } catch (error) {
    try {
      for (const key of keys) {
        const value = previous.get(key);
        if (value === null || value === undefined) await adapter.removeItem(key);
        else await adapter.setItem(key, value);
      }
    } catch (rollbackError) {
      throw new StorageTransactionError('本地恢复写入失败，回滚也未能完成。', { cause: rollbackError });
    }
    throw error;
  }
}

/**
 * Remove a group of keys with the same best-effort rollback semantics as
 * transactionalReplace. AsyncStorage does not expose a portable multi-key
 * transaction, so callers must treat failures as a failed operation and keep
 * their in-memory state unchanged.
 */
export async function transactionalRemove(
  keys: string[],
  adapter: StorageTransactionAdapter,
): Promise<void> {
  const uniqueKeys = [...new Set(keys)];
  const previous = new Map<string, string | null>();
  for (const key of uniqueKeys) previous.set(key, await adapter.getItem(key));

  try {
    for (const key of uniqueKeys) await adapter.removeItem(key);
  } catch (error) {
    try {
      for (const key of uniqueKeys) {
        const value = previous.get(key);
        if (value === null || value === undefined) await adapter.removeItem(key);
        else await adapter.setItem(key, value);
      }
    } catch (rollbackError) {
      throw new StorageTransactionError('本地删除失败，回滚也未能完成。', { cause: rollbackError });
    }
    throw error;
  }
}
