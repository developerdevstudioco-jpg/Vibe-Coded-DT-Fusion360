import React, { useState } from 'react';
import { Folder, File, Image as ImageIcon, MoreVertical } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from '../ui/context-menu';
import { Checkbox } from '../ui/checkbox';
import { FileSystemNode } from './index';
import { cn } from '../ui/utils';

interface GridProps {
  items: FileSystemNode[];
  selectedItem: FileSystemNode | null;
  multiSelectedIds: Set<string>;
  onItemClick: (item: FileSystemNode) => void;
  onItemDoubleClick: (item: FileSystemNode) => void;
  onContextMenu: (item: FileSystemNode, e: React.MouseEvent) => void;
}

const Grid: React.FC<GridProps> = ({
  items,
  selectedItem,
  multiSelectedIds,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
}) => {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <p>No items in this folder</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {items.map((item) => (
        <GridItem
          key={item.id}
          item={item}
          isSelected={selectedItem?.id === item.id}
          isMultiSelected={multiSelectedIds.has(item.id)}
          onDoubleClick={() => onItemDoubleClick(item)}
          onClick={() => onItemClick(item)}
          onContextMenu={(e) => onContextMenu(item, e)}
        />
      ))}
    </div>
  );
};

interface GridItemProps {
  item: FileSystemNode;
  isSelected: boolean;
  isMultiSelected: boolean;
  onDoubleClick: () => void;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

const GridItem: React.FC<GridItemProps> = ({
  item,
  isSelected,
  isMultiSelected,
  onDoubleClick,
  onClick,
  onContextMenu,
}) => {
  const [showCheckbox, setShowCheckbox] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'folder':
        return <Folder size={40} className="text-blue-500" />;
      case 'image':
        return <ImageIcon size={40} className="text-purple-500" />;
      default:
        return <File size={40} className="text-slate-400" />;
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={cn(
            'rounded-lg border border-slate-200 bg-white p-3 cursor-pointer transition-all',
            'hover:shadow-md hover:border-slate-300',
            isSelected && 'outline-2 outline-offset-2 outline-blue-500',
            'group relative'
          )}
          onMouseEnter={() => item.type === 'folder' && setShowCheckbox(true)}
          onMouseLeave={() => setShowCheckbox(false)}
          onDoubleClick={onDoubleClick}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          {/* Checkbox for folders */}
          {item.type === 'folder' && (showCheckbox || isMultiSelected) && (
            <div className="absolute top-2 left-2 z-10">
              <Checkbox checked={isMultiSelected} />
            </div>
          )}

          {/* Icon or Thumbnail */}
          <div
            className={cn(
              'w-24 h-24 rounded-lg flex items-center justify-center mb-3 mx-auto',
              item.type === 'image' ? 'bg-slate-100' : 'bg-blue-50'
            )}
          >
            {item.type === 'image' && item.src ? (
              <img
                src={item.src}
                alt={item.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              getIcon()
            )}
          </div>

          {/* Title */}
          <div className="font-semibold text-sm line-clamp-2 text-center mb-1">
            {item.name}
          </div>

          {/* Meta info */}
          <div className="text-xs text-slate-500 text-center">
            {item.type === 'folder'
              ? `${item.children?.length || 0} items`
              : item.size || ''}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onClick}>Open</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem className="text-red-600">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default Grid;
