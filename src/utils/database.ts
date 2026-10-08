import { getAPI } from './api';

export interface DatabaseRow {
  fileId: string;
  name: string;
  frontmatter: Record<string, any>;
  path: string;
}

export async function fetchDatabaseRows(folderPath: string): Promise<DatabaseRow[]> {
  const api = getAPI();
  const files = await api.listFiles(folderPath); // Fetch files from the folder using existing listFiles API.
  // Let's use local fileSystem API or localDB?
  
  // Need to know how to get all files.
  // Wait, let's use the localDB.
  return [];
}
