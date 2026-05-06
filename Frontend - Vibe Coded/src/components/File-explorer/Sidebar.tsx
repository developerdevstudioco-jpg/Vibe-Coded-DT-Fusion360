import React, { JSX, useMemo } from 'react';
import { ChevronDown, ChevronRight, Folder, Menu } from 'lucide-react';
import { Button } from '../ui/button';
import { useFileSystem } from './useFileSystem';
import { FileSystemNode } from './index';
import { cn } from '../ui/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { fs, current, openFolder, toggleExpanded } = useFileSystem();

  const getFolderTree = (node: FileSystemNode, depth = 0): JSX.Element[] => {
    if (node.type !== 'folder') return [];

    const children = node.children?.filter((ch) => ch.type === 'folder') || [];
    const isExpanded = node.expanded !== false;
    const isSelected = current.id === node.id;

    const items: JSX.Element[] = [];

    // Only render root and subsequent levels
    if (depth > 0 || node.id === 'root') {
      items.push(
        <li key={node.id}>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors',
              isSelected && 'bg-blue-50 border-l-2 border-blue-500 text-blue-600'
            )}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
            onClick={() => openFolder(node.id, true)}
          >
            {children.length > 0 && (
              <button
                className="p-0 hover:bg-slate-200 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.id);
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}
            {children.length === 0 && <div className="w-4" />}
            <Folder size={20} className="flex-shrink-0" />
            <span className="whitespace-nowrap overflow-hidden text-overflow-ellipsis flex-1">
              {node.name}
            </span>
          </div>

          {isExpanded && children.length > 0 && (
            <ul>
              {children.map((child) => getFolderTree(child, depth + 1))}
            </ul>
          )}
        </li>
      );
    } else if (node.id === 'root') {
      // Render root children
      children.forEach((child) => {
        items.push(...getFolderTree(child, depth + 1));
      });
    }

    return items;
  };

  return (
    <aside
      className={cn(
        'bg-white border-r border-slate-200 p-3 flex flex-col transition-all duration-200',
        collapsed ? 'w-16 items-center' : 'w-80 min-w-80'
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
        >
          <Menu size={20} />
        </Button>
        {!collapsed && (
          <h2 className="text-lg font-semibold">Navigation</h2>
        )}
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-auto">
          <ul className="space-y-1 text-sm">
            {fs.children?.map((child) => (
              <React.Fragment key={child.id}>
                {getFolderTree(child, 0)}
              </React.Fragment>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
