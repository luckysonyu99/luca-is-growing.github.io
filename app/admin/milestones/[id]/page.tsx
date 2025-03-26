'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { getMilestone, updateMilestone, uploadMilestonePhoto, deleteMilestonePhoto } from '@/models/milestone';
import type { Milestone } from '@/models/milestone';
import Image from 'next/image';

// 添加 generateStaticParams 函数
export async function generateStaticParams() {
  // 由于这是管理页面，我们可以返回一个空数组
  // 这意味着这个页面将不会在构建时生成
  return [];
}

export default function EditMilestonePage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    milestone_date: '',
    category: '',
    photo_url: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    const fetchMilestone = async () => {
      try {
        const data = await getMilestone(parseInt(params.id));
        if (data) {
          setMilestone(data);
          setFormData({
            title: data.title,
            description: data.description,
            milestone_date: data.milestone_date.split('T')[0],
            category: data.category,
            photo_url: data.photo_url || '',
          });
        }
      } catch (err) {
        setError('获取里程碑数据失败');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMilestone();
  }, [loading, user, router, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedMilestone = await updateMilestone(parseInt(params.id), formData);
      if (updatedMilestone) {
        router.push('/admin/milestones');
      }
    } catch (err) {
      setError('更新里程碑失败');
      console.error(err);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('无法创建画布'));
            return;
          }

          // 计算新的尺寸，保持宽高比
          let width = img.width;
          let height = img.height;
          const maxSize = 1200; // 最大尺寸
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // 转换为文件
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('无法压缩图片'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8 // 压缩质量
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      // 压缩图片
      const compressedFile = await compressImage(file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const photoUrl = await uploadMilestonePhoto(compressedFile);
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (photoUrl) {
        setFormData(prev => ({ ...prev, photo_url: photoUrl }));
      } else {
        setError('上传照片失败');
      }
    } catch (err) {
      setError('上传照片失败');
      console.error(err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePhotoDelete = async () => {
    if (!formData.photo_url) return;

    try {
      const success = await deleteMilestonePhoto(formData.photo_url);
      if (success) {
        setFormData(prev => ({ ...prev, photo_url: '' }));
      } else {
        setError('删除照片失败');
      }
    } catch (err) {
      setError('删除照片失败');
      console.error(err);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!milestone) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">未找到里程碑</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">编辑里程碑 ✨</h1>
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标题 📝
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              描述 📄
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日期 📅
            </label>
            <input
              type="date"
              value={formData.milestone_date}
              onChange={(e) => setFormData(prev => ({ ...prev, milestone_date: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分类 🎨
            </label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              照片 📸
            </label>
            {formData.photo_url && (
              <div className="relative h-48 mb-4 rounded-lg overflow-hidden group">
                <Image
                  src={formData.photo_url}
                  alt="里程碑照片"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={handlePhotoDelete}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  🗑️
                </button>
              </div>
            )}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={isUploading}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                  <div className="w-full max-w-xs">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-600 mt-2">
                      上传中... {uploadProgress}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/admin/milestones')}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消 ❌
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              保存 ✅
            </button>
          </div>
        </div>
      </form>
    </div>
  );
} 