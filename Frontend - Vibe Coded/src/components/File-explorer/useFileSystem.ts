import { useState, useCallback } from 'react';
import { FileSystemNode } from './index';

const IMG1 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='#3b82f6'/><text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle' fill='white' font-size='36'>IMG</text></svg>`);
const IMG2 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='#22c55e'/></svg>`);
const IMG3 = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns='http://www.w3.org/2000/svg' width='256' height='256'><rect width='256' height='256' fill='#8b5cf6'/></svg>`);

const INITIAL_FS: FileSystemNode = {
  id: 'root',
  name: 'Home',
  type: 'folder',
  created: '2024-01-01',
  modified: '2026-02-10',
  expanded: true,
  children: [
    {
      id: 'desktop',
      name: 'Festival-collections',
      type: 'folder',
      created: '2025-09-01',
      modified: '2026-01-12',
      expanded: true,
      children: [
        {
          id: 'wall1',
          name: 'Wallpapers',
          type: 'folder',
          children: [
            { id: 'img1', name: 'Blue Mountains.jpg', type: 'image', size: '1.2 MB', src: IMG1 },
            { id: 'img2', name: 'Forest.png', type: 'image', size: '980 KB', src: IMG2 },
            { id: 'img3', name: 'Purple.png', type: 'image', size: '1.3 MB', src: IMG3 },
          ],
        },
        {
          id: 'short',
          name: 'Shortcuts',
          type: 'folder',
          children: [],
        },
      ],
    },
    {
      id: 'documents',
      name: 'Documents',
      type: 'folder',
      children: [
        { id: 'specs', name: 'Specs', type: 'folder', children: [] },
        { id: 'proj', name: 'Project A', type: 'folder', children: [] },
      ],
    },
    {
      id: 'pictures',
      name: 'Pictures',
      type: 'folder',
      expanded: true,
      children: [
        {
          id: 'camera',
          name: 'Camera Roll',
          type: 'folder',
          children: [
            { id: 'img4', name: 'IMG_0001.jpg', type: 'image', size: '2.0 MB', src: IMG1 },
            { id: 'img5', name: 'IMG_0002.jpg', type: 'image', size: '1.8 MB', src: IMG2 },
          ],
        },
        {
          id: 'wallpapers',
          name: 'Wallpapers',
          type: 'folder',
          children: [
            { id: 'img6', name: 'Wallpaper_01.jpg', type: 'image', size: '2.6 MB', src: IMG3 },
          ],
        },
      ],
    },
    {
      id: 'downloads',
      name: 'Downloads',
      type: 'folder',
      children: [],
    },
  ],
};

function generateId(prefix = 'id'): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useFileSystem() {
  const [fs, setFs] = useState<FileSystemNode>(INITIAL_FS);
  const [current, setCurrent] = useState<FileSystemNode>(INITIAL_FS);
  const [selectedItem, setSelectedItem] = useState<FileSystemNode | null>(null);
  const [multiSelectedIds, setMultiSelectedIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<string[]>([INITIAL_FS.id]);
  const [histIndex, setHistIndex] = useState(0);

  const traverse = useCallback(
    (node: FileSystemNode, callback: (node: FileSystemNode, parent: FileSystemNode | null, depth: number) => void, parent: FileSystemNode | null = null, depth: number = 0) => {
      callback(node, parent, depth);
      if (node.type === 'folder' && Array.isArray(node.children)) {
        node.children.forEach((ch) => traverse(ch, callback, node, depth + 1));
      }
    },
    []
  );

  const findById = useCallback(
    (id: string): { node: FileSystemNode | null; parent: FileSystemNode | null } => {
      let foundNode: FileSystemNode | null = null;
      let foundParent: FileSystemNode | null = null;

      traverse(fs, (node, parent) => {
        if (node.id === id) {
          foundNode = node;
          foundParent = parent;
        }
      });

      return { node: foundNode, parent: foundParent };
    },
    [fs, traverse]
  );

  const getPath = useCallback(
    (node: FileSystemNode): FileSystemNode[] => {
      const chain: FileSystemNode[] = [];
      const parents = new Map<string, FileSystemNode | null>();
      const stack: Array<{ n: FileSystemNode; p: FileSystemNode | null }> = [{ n: fs, p: null }];

      while (stack.length) {
        const { n: current, p } = stack.pop()!;
        parents.set(current.id, p);

        if (current === node) {
          let cur: FileSystemNode | null = node;
          while (cur) {
            chain.unshift(cur);
            cur = parents.get(cur.id) || null;
          }
          break;
        }

        if (current.type === 'folder' && current.children) {
          for (let i = current.children.length - 1; i >= 0; i--) {
            stack.push({ n: current.children[i], p: current });
          }
        }
      }

      return chain;
    },
    [fs]
  );

  const openFolder = useCallback((id: string, addToHistory = true) => {
    const { node } = findById(id);
    if (node && node.type === 'folder') {
      setCurrent(node);
      setMultiSelectedIds(new Set());
      setSelectedItem(null);

      if (addToHistory) {
        setHistory((prev) => [...prev.slice(0, histIndex + 1), id]);
        setHistIndex((prev) => prev + 1);
      }
    }
  }, [findById, histIndex]);

  const createFolder = useCallback(
    (name: string): boolean => {
      if (!name.trim()) {
        alert('Name cannot be empty');
        return false;
      }

      if (current.children?.some((n) => n.name.toLowerCase() === name.toLowerCase())) {
        alert('A folder with this name already exists');
        return false;
      }

      const newFolder: FileSystemNode = {
        id: generateId('f'),
        name: name.trim(),
        type: 'folder',
        children: [],
        created: getTodayDate(),
        modified: getTodayDate(),
      };

      setFs((prevFs) => {
        const updateCurrent = (node: FileSystemNode): FileSystemNode => {
          if (node.id === current.id) {
            return {
              ...node,
              children: [newFolder, ...(node.children || [])],
            };
          }
          if (node.children) {
            return {
              ...node,
              children: node.children.map(updateCurrent),
            };
          }
          return node;
        };

        const updated = updateCurrent(prevFs);
        setCurrent({
          ...current,
          children: [newFolder, ...(current.children || [])],
        });
        return updated;
      });

      return true;
    },
    [current]
  );

  const renameNode = useCallback(
    (id: string, newName: string): boolean => {
      if (!newName.trim()) {
        alert('Name cannot be empty');
        return false;
      }

      const { node, parent } = findById(id);
      if (!node || !parent) return false;

      if (parent.children?.some((n) => n !== node && n.name.toLowerCase() === newName.toLowerCase())) {
        alert('A file with this name already exists');
        return false;
      }

      setFs((prevFs) => {
        const update = (n: FileSystemNode): FileSystemNode => {
          if (n.id === id) {
            return {
              ...n,
              name: newName.trim(),
              modified: getTodayDate(),
            };
          }
          if (n.children) {
            return {
              ...n,
              children: n.children.map(update),
            };
          }
          return n;
        };

        return update(prevFs);
      });

      if (selectedItem?.id === id) {
        setSelectedItem((prev) => (prev ? { ...prev, name: newName.trim() } : null));
      }

      return true;
    },
    [findById, selectedItem?.id]
  );

  const deleteNode = useCallback(
    (id: string): boolean => {
      const { node, parent } = findById(id);
      if (!node || !parent) return false;

      setFs((prevFs) => {
        const update = (n: FileSystemNode): FileSystemNode => {
          if (n.id === parent.id) {
            return {
              ...n,
              children: n.children?.filter((child) => child.id !== id) || [],
            };
          }
          if (n.children) {
            return {
              ...n,
              children: n.children.map(update),
            };
          }
          return n;
        };

        return update(prevFs);
      });

      if (selectedItem?.id === id) {
        setSelectedItem(null);
      }

      setMultiSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      return true;
    },
    [findById, selectedItem?.id]
  );

  const toggleExpanded = useCallback((id: string) => {
    setFs((prevFs) => {
      const update = (node: FileSystemNode): FileSystemNode => {
        if (node.id === id && node.type === 'folder') {
          return {
            ...node,
            expanded: !node.expanded,
          };
        }
        if (node.children) {
          return {
            ...node,
            children: node.children.map(update),
          };
        }
        return node;
      };

      return update(prevFs);
    });
  }, []);

  const navigateBack = useCallback(() => {
    if (histIndex > 0) {
      const newIndex = histIndex - 1;
      setHistIndex(newIndex);
      const { node } = findById(history[newIndex]);
      if (node && node.type === 'folder') {
        setCurrent(node);
      }
    }
  }, [histIndex, history, findById]);

  const navigateForward = useCallback(() => {
    if (histIndex < history.length - 1) {
      const newIndex = histIndex + 1;
      setHistIndex(newIndex);
      const { node } = findById(history[newIndex]);
      if (node && node.type === 'folder') {
        setCurrent(node);
      }
    }
  }, [histIndex, history, findById]);

  const navigateUp = useCallback(() => {
    const { parent } = findById(current.id);
    if (parent) {
      openFolder(parent.id, true);
    }
  }, [current.id, findById, openFolder]);

  return {
    fs,
    current,
    selectedItem,
    setSelectedItem,
    multiSelectedIds,
    setMultiSelectedIds,
    history,
    histIndex,
    findById,
    getPath,
    openFolder,
    createFolder,
    renameNode,
    deleteNode,
    toggleExpanded,
    navigateBack,
    navigateForward,
    navigateUp,
  };
}
