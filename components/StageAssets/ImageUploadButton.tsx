import React from 'react';
import { Upload, Sparkles, Loader2 } from 'lucide-react';

interface ImageUploadButtonProps {
  onUpload: (file: File) => void;
  onGenerate?: () => void;
  isGenerating?: boolean;
  hasImage?: boolean;
  uploadLabel?: string;
  generateLabel?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'inline' | 'separate';
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onUpload,
  onGenerate,
  isGenerating = false,
  hasImage = false,
  uploadLabel = '上传',
  generateLabel = '生成',
  size = 'medium',
  variant = 'separate',
}) => {
  const sizeClasses = {
    small: 'px-3 py-1.5 text-[10px]',
    medium: 'px-4 py-2 text-xs',
    large: 'px-6 py-3 text-sm',
  };

  const buttonClass = `${sizeClasses[size]} bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded font-bold transition-all border border-zinc-700 flex items-center gap-1 cursor-pointer`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = '';
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex gap-1">
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={buttonClass}
          >
            {isGenerating ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            {generateLabel}
          </button>
        )}
        <label className={buttonClass}>
          <Upload className="w-3 h-3" />
          {uploadLabel}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    );
  }

  // Separate variant for regenerate + upload
  return (
    <div className="flex gap-2">
      {onGenerate && hasImage && (
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className={`flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              重新生成
            </>
          )}
        </button>
      )}
      <label className={`flex-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-zinc-800 transition-colors cursor-pointer`}>
        <Upload className="w-3 h-3" />
        {uploadLabel}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default ImageUploadButton;
