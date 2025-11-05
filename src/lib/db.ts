import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface NelsonDB extends DBSchema {
  conversations: {
    key: string;
    value: {
      id: string;
      title: string;
      mode: 'academic' | 'clinical';
      messages: any[];
      createdAt: Date;
      updatedAt: Date;
      syncStatus: 'synced' | 'pending' | 'failed';
    };
    indexes: { 'by-updated': Date };
  };
  offlineQueue: {
    key: number;
    value: {
      id?: number;
      action: string;
      payload: any;
      timestamp: Date;
      retryCount: number;
    };
    indexes: { 'by-timestamp': Date };
  };
  settings: {
    key: string;
    value: any;
  };
}

let dbInstance: IDBPDatabase<NelsonDB> | null = null;

export const initDB = async (): Promise<IDBPDatabase<NelsonDB>> => {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB<NelsonDB>('nelson-gpt-db', 1, {
    upgrade(db) {
      // Conversations store
      if (!db.objectStoreNames.contains('conversations')) {
        const convStore = db.createObjectStore('conversations', {
          keyPath: 'id',
        });
        convStore.createIndex('by-updated', 'updatedAt');
      }
      
      // Offline queue store
      if (!db.objectStoreNames.contains('offlineQueue')) {
        const queueStore = db.createObjectStore('offlineQueue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('by-timestamp', 'timestamp');
      }
      
      // Settings store
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    },
  });
  
  return dbInstance;
};

export const db = {
  // Conversations
  async getConversations() {
    const db = await initDB();
    return db.getAll('conversations');
  },
  
  async getConversation(id: string) {
    const db = await initDB();
    return db.get('conversations', id);
  },
  
  async saveConversation(conversation: any) {
    const db = await initDB();
    return db.put('conversations', {
      ...conversation,
      updatedAt: new Date(),
    });
  },
  
  async deleteConversation(id: string) {
    const db = await initDB();
    return db.delete('conversations', id);
  },
  
  // Offline queue
  async addToQueue(action: string, payload: any) {
    const db = await initDB();
    return db.add('offlineQueue', {
      action,
      payload,
      timestamp: new Date(),
      retryCount: 0,
    });
  },
  
  async getQueue() {
    const db = await initDB();
    return db.getAll('offlineQueue');
  },
  
  async removeFromQueue(id: number) {
    const db = await initDB();
    return db.delete('offlineQueue', id);
  },
  
  async clearQueue() {
    const db = await initDB();
    const tx = db.transaction('offlineQueue', 'readwrite');
    await tx.store.clear();
    await tx.done;
  },
  
  // Settings
  async getSetting(key: string) {
    const db = await initDB();
    return db.get('settings', key);
  },
  
  async saveSetting(key: string, value: any) {
    const db = await initDB();
    return db.put('settings', { key, value });
  },
};