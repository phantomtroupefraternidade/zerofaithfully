import { get, set } from 'idb-keyval';

export async function getLibraryFolder() {
  const handle = await get('library-folder-handle');
  if (handle) {
    const permission = await handle.queryPermission({ mode: 'readwrite' });
    if (permission === 'granted') return handle;
    if (permission === 'prompt') {
      if (await handle.requestPermission({ mode: 'readwrite' }) === 'granted') {
        return handle;
      }
    }
  }
  return null;
}

export async function setLibraryFolder() {
  try {
    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite'
    });
    await set('library-folder-handle', handle);
    return handle;
  } catch (err) {
    console.error('Failed to set library folder:', err);
    return null;
  }
}

export async function saveFileToFolder(folderHandle: any, fileName: string, blob: Blob, category?: string) {
  try {
    let targetFolder = folderHandle;
    
    // Create subdirectory if category is provided
    if (category) {
      targetFolder = await folderHandle.getDirectoryHandle(category, { create: true });
    }

    const fileHandle = await targetFolder.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (err) {
    console.error('Failed to save file to folder:', err);
    return false;
  }
}
