import React, { useState, useEffect, useMemo } from 'react';
import { getAPI } from '../../utils/api';
import { FileEntry } from '../../types';
import { parseFrontmatter, updateFrontmatter, getAllMarkdownFiles } from '../../utils/frontmatter';
import { Table, ArrowUpDown, Plus } from 'lucide-react';

interface DatabaseViewProps {
  folderNode: FileEntry;
  onOpenFile: (path: string) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ folderNode, onOpenFile }) => {
  const [rows, setRows] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>(['name']);
  const [isLoading, setIsLoading] = useState(true);

  // Sorting state
  const [sortCol, setSortCol] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      const api = getAPI();
      const files = getAllMarkdownFiles(folderNode);
      
      const parsedRows: any[] = [];
      const allKeys = new Set<string>();
      
      for (const file of files) {
        const content = await api.readFile(file.path);
        const { properties } = parseFrontmatter(content);
        
        const rowData: any = { 
          _path: file.path, 
          name: file.name.replace('.md', ''),
          _rawContent: content
        };
        
        for (const prop of properties) {
          rowData[prop.key] = prop.value;
          allKeys.add(prop.key);
        }
        
        parsedRows.push(rowData);
      }
      
      if (isMounted) {
        setRows(parsedRows);
        setColumns(['name', ...Array.from(allKeys)]);
        setIsLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [folderNode]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA = a[sortCol];
      let valB = b[sortCol];
      
      if (valA === undefined) valA = '';
      if (valB === undefined) valB = '';
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const handleCellEdit = async (path: string, key: string, newValue: string) => {
    // Optimistic UI update
    setRows(prev => prev.map(r => r._path === path ? { ...r, [key]: newValue } : r));

    const row = rows.find(r => r._path === path);
    if (!row) return;

    const updatedContent = updateFrontmatter(row._rawContent, { [key]: newValue });
    const api = getAPI();
    await api.writeFile(path, updatedContent);

    // Update raw content in state so next edit works cleanly
    setRows(prev => prev.map(r => r._path === path ? { ...r, _rawContent: updatedContent } : r));
  };

  if (isLoading) {
    return <div className="p-8 text-(--text-muted) flex items-center gap-2">
       <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-(--text-muted)"></span> Loading Database...
    </div>;
  }

  return (
    <div className="flex-1 w-full h-full overflow-auto bg-(--bg-primary) text-(--text-primary)">
      <div className="max-w-[1200px] mx-auto px-12 py-8">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <Table size={28} className="text-(--text-muted)" />
          <h1 className="text-2xl font-bold tracking-tight m-0">{folderNode.name}</h1>
        </div>

        <div className="mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer text-sm text-(--text-secondary) font-medium transition-all duration-200 border border-transparent hover:bg-(--bg-hover) hover:border-(--border-subtle)">
            <Table size={16} />
            Table
          </div>
        </div>

        <div className="border border-(--border-subtle) rounded-lg shadow-none overflow-hidden bg-(--bg-primary) w-full overflow-x-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th 
                      key={col} 
                      className="group px-4 py-2 font-normal text-(--text-muted) text-sm border-r border-b border-(--border-subtle) last:border-r-0 cursor-pointer transition-colors duration-200 select-none hover:bg-(--bg-hover)"
                      onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center gap-1.5">
                        {col === 'name' ? (
                          <span className="font-mono text-xs opacity-70 flex items-center transition-opacity duration-200 group-hover:opacity-100">Aa</span>
                        ) : (
                          <span className="font-mono text-xs opacity-70 flex items-center transition-opacity duration-200 group-hover:opacity-100">{'\u2261'}</span>
                        )}
                        <span>{col}</span>
                        {sortCol === col && <ArrowUpDown size={12} className="opacity-50 ml-1" />}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map(row => (
                  <tr key={row._path} className="group border-b border-(--border-subtle) last:border-b-0 transition-colors duration-150 hover:bg-(--bg-hover)">
                    {columns.map(col => (
                      <td key={col} className="px-4 py-2 border-r border-(--border-subtle) last:border-r-0 min-w-[150px] max-w-[300px] text-ellipsis overflow-hidden text-sm">
                        {col === 'name' ? (
                          <span 
                            className="font-medium cursor-pointer inline-block w-full overflow-hidden text-ellipsis hover:underline hover:decoration-(--border-strong) hover:underline-offset-4"
                            onClick={() => onOpenFile(row._path)}
                          >
                            {row[col]}
                          </span>
                        ) : (
                          <input
                            type="text"
                            className="w-full bg-transparent border-none outline-none p-0 text-(--text-secondary) transition-colors duration-200 focus:text-(--text-primary)"
                            value={row[col] !== undefined ? (Array.isArray(row[col]) ? row[col].join(", ") : row[col]) : ''}
                            placeholder=""
                            onChange={(e) => {
                              const val = e.target.value;
                              setRows(prev => prev.map(r => r._path === row._path ? { ...r, [col]: val } : r));
                            }}
                            onBlur={(e) => handleCellEdit(row._path, col, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length} className="px-4 py-8 text-center text-(--text-muted) italic text-sm">
                      No files with frontmatter found.
                    </td>
                  </tr>
                )}
                <tr className="group border-t border-(--border-subtle) cursor-pointer text-(--text-muted) text-sm transition-colors duration-150 hover:bg-(--bg-hover)">
                   <td colSpan={columns.length}>
                       <div className="px-4 py-2 opacity-70 flex items-center gap-2 transition-opacity duration-200 group-hover:opacity-100">
                         <Plus size={16} /> New
                       </div>
                   </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="mt-4 text-[13px] text-(--text-muted) opacity-80 px-1">
          {sortedRows.length} {sortedRows.length === 1 ? 'item' : 'items'}
        </div>
      </div>
    </div>
  );
};
