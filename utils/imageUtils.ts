import { imageStorageService } from '../services/imageStorageService';

export interface ImageSource {
  type: 'local' | 'cloud' | 'base64';
  url?: string;
  localImageId?: string;
}

export const parseImageUrl = (imageUrl: string | undefined): ImageSource => {
  if (!imageUrl) {
    return { type: 'cloud' };
  }

  // 检查是否是本地图片 ID（格式：local:{id}）
  if (imageUrl.startsWith('local:')) {
    const localImageId = imageUrl.substring(6);
    return { type: 'local', localImageId };
  }

  // 检查是否是 base64 图片
  if (imageUrl.startsWith('data:image')) {
    return { type: 'base64', url: imageUrl };
  }

  // 默认是云端 URL
  return { type: 'cloud', url: imageUrl };
};

export const getImageUrl = async (imageUrl: string | undefined): Promise<string | null> => {
  const source = parseImageUrl(imageUrl);

  if (source.type === 'local') {
    // 从本地 IndexedDB 加载
    const blob = await imageStorageService.getImage(source.localImageId!);
    if (!blob) {
      console.warn('[ImageUtils] 本地图片不存在:', source.localImageId);
      return null;
    }
    return URL.createObjectURL(blob);
  }

  if (source.type === 'base64') {
    // 直接返回 base64
    return source.url;
  }

  // 返回云端 URL
  return source.url || null;
};

export const isLocalImage = (imageUrl: string | undefined): boolean => {
  return imageUrl?.startsWith('local:') || false;
};

export const getLocalImageId = (imageUrl: string | undefined): string | undefined => {
  if (isLocalImage(imageUrl)) {
    return imageUrl?.substring(6);
  }
  return undefined;
};

export const revokeObjectUrl = (url: string | null): void => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
