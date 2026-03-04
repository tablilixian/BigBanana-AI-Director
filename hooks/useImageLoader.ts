import { useState, useEffect, useRef } from 'react';
import { getImageUrl, revokeObjectUrl, parseImageUrl } from '../utils/imageUtils';

export const useImageLoader = (imageUrl: string | undefined) => {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      const source = parseImageUrl(imageUrl);
      
      if (source.type === 'cloud' && source.url) {
        // 云端图片直接使用
        setSrc(source.url);
        return;
      }

      if (source.type === 'base64' && source.url) {
        // Base64 图片直接使用
        setSrc(source.url);
        return;
      }

      if (source.type === 'local') {
        // 本地图片需要从 IndexedDB 加载
        setLoading(true);
        setError(false);
        
        try {
          const url = await getImageUrl(imageUrl);
          setSrc(url);
          
          // 保存 object URL 以便后续清理
          if (url && url.startsWith('blob:')) {
            objectUrlRef.current = url;
          }
        } catch (err) {
          console.error('[useImageLoader] 加载图片失败:', err);
          setError(true);
        } finally {
          setLoading(false);
        }
      }
    };

    loadImage();

    // 清理函数：释放 object URL
    return () => {
      if (objectUrlRef.current) {
        revokeObjectUrl(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [imageUrl]);

  return { src, loading, error };
};
