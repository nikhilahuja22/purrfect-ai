// Stores uploaded files in IndexedDB, which can hold PDFs far larger than localStorage.
const DB_NAME = 'purrfect-ai';
const DB_VERSION = 1;
const FILES_STORE = 'document-files';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(FILES_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(FILES_STORE, mode);
      const request = run(transaction.objectStore(FILES_STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

export async function saveFile(id: string, file: Blob): Promise<void> {
  await withStore('readwrite', (store) => store.put(file, id));
}

export async function loadFile(id: string): Promise<Blob | undefined> {
  return withStore<Blob | undefined>('readonly', (store) => store.get(id));
}

export async function deleteFile(id: string): Promise<void> {
  await withStore('readwrite', (store) => store.delete(id));
}
