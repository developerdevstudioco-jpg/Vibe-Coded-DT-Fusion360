import React from 'react';
import { ChevronLeft, ChevronRight, ArrowUp } from 'lucide-react';
import { Button } from '../ui/button';
import { useFileSystem } from './useFileSystem';
import { FileSystemNode } from './index';
import { cn } from '../ui/utils';

interface TopbarProps {
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  currentPath: FileSystemNode;
}

const Topbar: React.FC<TopbarProps> = ({
  onBack,
  onForward,
  onUp,
  canGoBack,
  canGoForward,
  currentPath,
}) => {
  const { getPath, openFolder } = useFileSystem();
  const path = getPath(currentPath);

  return (
    <div className="flex items-center gap-3 p-3 border-b border-slate-200">
      {/* Navigation Buttons */}
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack}
          className="h-8 w-8"
        >
          <ChevronLeft size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onForward}
          disabled={!canGoForward}
          className="h-8 w-8"
        >
          <ChevronRight size={18} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onUp}
          className="h-8 w-8"
        >
          <ArrowUp size={18} />
        </Button>
      </div>

      {/* Breadcrumb */}
      <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 overflow-auto">
        <span className="text-slate-600">📂</span>
        <div className="flex items-center gap-1 overflow-auto">
          {path.map((node, index) => (
            <React.Fragment key={node.id}>
              {index > 0 && <span className="text-slate-400 flex-shrink-0">›</span>}
              <button
                onClick={() => openFolder(node.id, true)}
                className={cn(
                  'px-2 py-1 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap',
                  index === path.length - 1
                    ? 'bg-blue-50 border border-blue-200 font-medium text-blue-600'
                    : 'hover:bg-slate-100'
                )}
              >
                {node.name}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Topbar;
