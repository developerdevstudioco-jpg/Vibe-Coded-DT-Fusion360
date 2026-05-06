import React from 'react';
import { Folder, File, Image } from 'lucide-react';
import { FileSystemNode } from './index';

interface InspectorProps {
  item: FileSystemNode | null;
}

const Inspector: React.FC<InspectorProps> = ({ item }) => {
  if (!item) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>Select an item to see details</p>
      </div>
    );
  }

  const getIcon = () => {
    switch (item.type) {
      case 'folder':
        return <Folder size={56} className="text-blue-500" />;
      case 'image':
        return <Image size={56} className="text-purple-500" />;
      default:
        return <File size={56} className="text-slate-400" />;
    }
  };

  return (
    <div>
      <div className="w-32 h-32 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {item.type === 'image' && item.src ? (
          <img
            src={item.src}
            alt={item.name}
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          getIcon()
        )}
      </div>

      <h3 className="text-center font-semibold mb-4">{item.name}</h3>

      <dl className="space-y-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-slate-600">Type</dt>
          <dd className="font-medium">{item.type}</dd>
        </div>

        {item.size && (
          <div className="flex justify-between">
            <dt className="text-slate-600">Size</dt>
            <dd className="font-medium">{item.size}</dd>
          </div>
        )}

        {item.created && (
          <div className="flex justify-between">
            <dt className="text-slate-600">Created</dt>
            <dd className="font-medium">{item.created}</dd>
          </div>
        )}

        {item.modified && (
          <div className="flex justify-between">
            <dt className="text-slate-600">Modified</dt>
            <dd className="font-medium">{item.modified}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};

export default Inspector;
