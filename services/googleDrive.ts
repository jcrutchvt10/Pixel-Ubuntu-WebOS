
export interface DriveConfig {
  clientId: string;
  apiKey: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  parents?: string[];
}

const STORAGE_KEY_TOKEN = 'ubuntu_web_drive_token';

let tokenClient: any;
let gisInited = false;
// Restore token from storage if available
let accessToken: string | null = localStorage.getItem(STORAGE_KEY_TOKEN);

// The name of the root folder in Google Drive where we store everything
const OS_ROOT_FOLDER_NAME = 'Ubuntu_Web_OS_Data';
let osRootId: string | null = null;

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Helper to wait for scripts to inject
const waitForScript = (globalVar: string) => {
    return new Promise<void>((resolve) => {
        if ((window as any)[globalVar]) return resolve();
        let retries = 0;
        const interval = setInterval(() => {
            retries++;
            if ((window as any)[globalVar]) {
                clearInterval(interval);
                resolve();
            }
            if (retries > 50) { // 5 seconds timeout
                clearInterval(interval);
                console.warn(`Timeout waiting for ${globalVar}`);
                resolve(); // Try anyway, might fail later
            }
        }, 100);
    });
};

// --- AUTHENTICATION ---

export const initGisClient = async (config: DriveConfig): Promise<void> => {
  if (gisInited) return; // Idempotent

  await waitForScript('google');
  
  if (!(window as any).google) throw new Error("Google Identity Services Script not loaded.");

  return new Promise((resolve, reject) => {
    try {
      tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: SCOPES,
        callback: (resp: any) => {
          if (resp.error) {
            if (resp.error === 'popup_closed_by_user' || resp.error === 'access_denied') {
                console.warn("User cancelled login or denied access.");
                window.dispatchEvent(new Event('drive-auth-cancelled'));
                return; // Graceful exit, do not alert
            }
            console.error("OAuth Error", resp);
            // Dispatch error event for UI handling instead of alert
            window.dispatchEvent(new Event('drive-auth-error'));
            return;
          }
          
          accessToken = resp.access_token;
          // Persist token
          if (accessToken) {
              localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
          }
          console.log("Access Token Received");
          window.dispatchEvent(new Event('drive-auth-changed'));
        },
        error_callback: (err: any) => {
           // This callback is for initialization errors (e.g. invalid client_id origin)
           // We log it but don't crash the app, allowing fallback to occur in UI
           console.warn("GIS Initialization Warning (likely origin mismatch):", err);
           window.dispatchEvent(new Event('drive-auth-error'));
        }
      });
      gisInited = true;
      resolve();
    } catch (err) {
        reject(err);
    }
  });
};

export const requestAuth = () => {
  if (!tokenClient) {
      console.error("Token Client not initialized. Call initGisClient first.");
      window.dispatchEvent(new Event('drive-auth-error'));
      return;
  }
  // Request access token.
  try {
    // Prompt for consent to ensure we get a fresh token if needed
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } catch (e) {
    console.error("Request Auth Failed", e);
    window.dispatchEvent(new Event('drive-auth-error'));
  }
};

export const signOut = () => {
  if (accessToken) {
    // Try to revoke if google object is available
    try {
        (window as any).google?.accounts?.oauth2?.revoke(accessToken);
    } catch(e) { console.warn("Revoke failed", e); }

    accessToken = null;
    osRootId = null;
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    window.dispatchEvent(new Event('drive-auth-changed'));
  }
};

export const isAuthenticated = () => !!accessToken;

// --- API HELPERS (FETCH) ---

const getHeaders = (multipart = false) => {
    const headers: Record<string, string> = {
        'Authorization': `Bearer ${accessToken}`,
    };
    if (!multipart) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

const checkAuth = () => {
    if (!accessToken) throw new Error("User not authenticated");
};

// --- FOLDER MANAGEMENT ---

export const getOsRootId = async (): Promise<string> => {
  if (osRootId) return osRootId;
  checkAuth();

  try {
    // 1. Search for existing folder
    const q = `name = '${OS_ROOT_FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`;
    
    const res = await fetch(url, { headers: getHeaders() });
    if (res.status === 401) {
        // Token likely expired
        signOut();
        throw new Error("Auth token expired");
    }
    const data = await res.json();

    if (data.files && data.files.length > 0) {
      osRootId = data.files[0].id;
      console.log(`[Drive] Found existing OS Root: ${osRootId}`);
      return osRootId!;
    }

    // 2. Create if not found
    console.log(`[Drive] Creating new OS Root: ${OS_ROOT_FOLDER_NAME}`);
    const folder = await createFolderInParent(OS_ROOT_FOLDER_NAME, 'root');
    if (folder) {
      osRootId = folder.id;
      return osRootId!;
    }
    throw new Error("Could not create OS root folder");
  } catch (e) {
    console.error("Error resolving OS root", e);
    throw e;
  }
};

export const findFileByName = async (name: string, parentId: string): Promise<DriveFile | null> => {
   checkAuth();
   try {
    const q = `name = '${name}' and '${parentId}' in parents and trashed = false`;
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime)&pageSize=1`;
    
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();

    return (data.files && data.files.length > 0) ? data.files[0] : null;
   } catch (e) {
       console.error("Error finding file", e);
       return null;
   }
};

// --- CORE OPERATIONS ---

const createFolderInParent = async (name: string, parentId: string): Promise<DriveFile | null> => {
  checkAuth();
  const metadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentId]
  };
  
  try {
    const res = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(metadata)
    });
    const data = await res.json();
    return data.id ? data : null;
  } catch (err) {
    console.error("Create Folder Error", err);
    return null;
  }
};

export const listFiles = async (folderId = 'root'): Promise<DriveFile[]> => {
  if (!accessToken) return [];
  
  // Resolve 'root' to our custom folder
  let targetId = folderId;
  if (folderId === 'root') {
      try {
          targetId = await getOsRootId();
      } catch (e) {
          return [];
      }
  }

  try {
    const q = `'${targetId}' in parents and trashed = false`;
    const fields = 'files(id,name,mimeType,size,modifiedTime,parents)';
    const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=${encodeURIComponent(fields)}&pageSize=100`;
    
    const res = await fetch(url, { headers: getHeaders() });
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error("Drive List Error", err);
    return [];
  }
};

export const getFileContent = async (fileId: string): Promise<string> => {
  checkAuth();
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: getHeaders()
    });
    return await res.text();
  } catch (err) {
    console.error("Drive Read Error", err);
    return "";
  }
};

export const createFile = async (name: string, content: string, parentId = 'root'): Promise<DriveFile | null> => {
  // Resolve 'root'
  let targetId = parentId;
  if (parentId === 'root') {
      targetId = await getOsRootId();
  }

  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";

  const contentType = 'application/json'; 
  const metadata = {
    name: name,
    mimeType: 'text/plain', 
    parents: [targetId]
  };

  const multipartRequestBody =
    delimiter +
    'Content-Type: ' + contentType + '\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    'Content-Type: text/plain\r\n\r\n' +
    content +
    close_delim;

  try {
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'multipart/related; boundary="' + boundary + '"'
        },
        body: multipartRequestBody
    });
    
    return await res.json();
  } catch (err) {
    console.error("Create File Error", err);
    return null;
  }
};

export const createFolder = async (name: string, parentId = 'root'): Promise<DriveFile | null> => {
  let targetId = parentId;
  if (parentId === 'root') {
      targetId = await getOsRootId();
  }
  return createFolderInParent(name, targetId);
};

export const deleteFile = async (fileId: string): Promise<void> => {
  checkAuth();
  try {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
  } catch (err) {
    console.error("Delete Error", err);
  }
};

export const updateFile = async (fileId: string, content: string): Promise<void> => {
    checkAuth();
    try {
        // Using upload endpoint for content update
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'text/plain'
            },
            body: content
        });
    } catch (e) {
        console.error("Update File Error", e);
    }
}
