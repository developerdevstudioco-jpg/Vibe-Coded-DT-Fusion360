import { Plus, RotateCcw, Search } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import FilterDrawer from './FilterDrawer';
import Grid from './Grid';
import { Filters } from './index';
import Inspector from './Inspector';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useFileSystem } from './useFileSystem';
import Layout from '../Layout';
import { User, Page } from '../../App';

interface FileManagerProps {
  user: User;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
}

const FileManager: React.FC<FileManagerProps> = ({ user, onNavigate, onLogout }) => {
  const {
    current,
    selectedItem,
    multiSelectedIds,
    history,
    histIndex,
    findById,
    openFolder,
    deleteNode,
    createFolder,
    renameNode,
    toggleExpanded,
    navigateBack,
    navigateForward,
    navigateUp,
  } = useFileSystem();

  const [searchQuery, setSearchQuery] = useState('');
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameId, setRenameId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleNewFolderClick = () => {
    setIsNewFolderOpen(true);
  };

  const handleCreateFolder = (name: string) => {
    if (createFolder(name)) {
      setIsNewFolderOpen(false);
    }
  };

  const handleRename = (id: string) => {
    const { node } = findById(id);
    if (node) {
      setRenameId(id);
      setRenameValue(node.name);
      setIsRenameOpen(true);
    }
  };

  const handleSaveRename = () => {
    if (renameId) {
      renameNode(renameId, renameValue);
      setIsRenameOpen(false);
      setRenameId(null);
    }
  };

  const handleDelete = (id: string) => {
    const { node } = findById(id);
    if (node && window.confirm(`Delete "${node.name}"?`)) {
      deleteNode(id);
    }
  };

  const filteredItems = useMemo(() => {
    let items = current.children || [];

    // Apply search filter
    if (searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filters.type && filters.type.length > 0) {
      items = items.filter(item => filters.type!.includes(item.type));
    }

    // Sort folders first, then alphabetically
    return items.sort((a, b) => {
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [current, searchQuery, filters]);

  const selectedCount = multiSelectedIds.size;

  return (
    <Layout user={user} currentPage="files" onNavigate={onNavigate} onLogout={onLogout} title="File Explorer">
      <div className="flex h-full bg-slate-50">
        {/* Sidebar */}
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Content */}
        <main className="flex flex-1 flex-col bg-white rounded-lg border border-slate-200 m-4">
          {/* Topbar */}
          <Topbar
            onBack={navigateBack}
            onForward={navigateForward}
            onUp={navigateUp}
            canGoBack={histIndex > 0}
            canGoForward={histIndex < history.length - 1}
            currentPath={current}
          />

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-3">
            <div className="flex justify-between items-center mb-4 text-sm text-slate-500">
              <div>Folders • {filteredItems.length} items</div>
            </div>

            {/* Toolbar */}
            <div className="flex gap-2 mb-4 items-center">
              <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5">
                <Search size={16} className="text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search in folder"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 p-0"
                />
              </div>
              <Button
                onClick={handleNewFolderClick}
                className="gap-2"
              >
                <Plus size={16} /> New Folder
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFilterOpen(true)}
                className="relative"
              >
                <RotateCcw size={16} />
                {selectedCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {selectedCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Grid */}
            <Grid
              items={filteredItems}
              selectedItem={selectedItem}
              multiSelectedIds={multiSelectedIds}
              onItemClick={(item) => {
                if (item.type === 'folder') {
                  openFolder(item.id);
                }
              }}
              onItemDoubleClick={(item) => {
                if (item.type === 'folder') {
                  openFolder(item.id);
                } else if (item.type === 'image') {
                  window.open(item.src, '_blank');
                }
              }}
              onContextMenu={(item, e) => {
                // Context menu is handled by the Grid component
              }}
            />
          </div>
        </main>

        {/* Inspector */}
        <div className="hidden lg:block w-80 bg-white rounded-lg border border-slate-200 m-4 p-4">
          <Inspector item={selectedItem} />
        </div>

        {/* Modals */}
        <NewFolderModal
          open={isNewFolderOpen}
          onOpenChange={setIsNewFolderOpen}
          onCreateFolder={handleCreateFolder}
        />

        <RenameModal
          open={isRenameOpen}
          onOpenChange={setIsRenameOpen}
          value={renameValue}
          onValueChange={setRenameValue}
          onSave={handleSaveRename}
        />

        {/* Filter Drawer */}
        <FilterDrawer
          open={isFilterOpen}
          onOpenChange={setIsFilterOpen}
          filters={filters}
          onFiltersChange={setFilters}
        />
      </div>
    </Layout>

  );
};

interface NewFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (name: string) => void;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({
  open,
  onOpenChange,
  onCreateFolder,
}) => {
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    if (value.trim()) {
      onCreateFolder(value.trim());
      setValue('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-2 block">
              Folder name
            </label>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit();
              }}
              placeholder="Enter folder name"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface RenameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onValueChange: (value: string) => void;
  onSave: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({
  open,
  onOpenChange,
  value,
  onValueChange,
  onSave,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 mb-2 block">
              New name
            </label>
            <Input
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSave();
              }}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button onClick={onSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FileManager;
