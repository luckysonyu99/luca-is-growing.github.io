'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Photo {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  created_at: string;
}

export default function GalleryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    category: '其他',
  });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      fetchPhotos();
    }
  }, [user]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) {
      alert('请先上传图片');
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('photos')
          .update(formData)
          .eq('id', isEditing);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('photos')
          .insert([formData]);

        if (error) throw error;
      }

      setIsAdding(false);
      setIsEditing(null);
      setFormData({
        title: '',
        description: '',
        image_url: '',
        category: '其他',
      });
      fetchPhotos();
    } catch (error) {
      console.error('Error saving photo:', error);
    }
  };

  const handleEdit = (photo: Photo) => {
    setIsEditing(photo.id);
    setFormData({
      title: photo.title,
      description: photo.description,
      image_url: photo.image_url,
      category: photo.category,
    });
    setIsAdding(true);
  };

  const handleDelete = async (id: string, image_url: string) => {
    if (!confirm('确定要删除这张照片吗？')) return;

    try {
      // 删除存储中的图片
      const imagePath = image_url.split('/').pop();
      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from('gallery')
          .remove([imagePath]);

        if (storageError) throw storageError;
      }

      // 删除数据库记录
      const { error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-candy-pink"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-qingke text-candy-purple">相册管理</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="px-4 py-2 bg-candy-pink text-white rounded-lg hover:bg-candy-purple transition-colors"
        >
          添加照片
        </button>
      </div>

      {isAdding && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">标题</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-candy-pink"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-candy-pink"
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">分类</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-candy-pink"
                required
              >
                <option value="其他">其他</option>
                <option value="生活">生活</option>
                <option value="旅行">旅行</option>
                <option value="美食">美食</option>
                <option value="风景">风景</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">图片</label>
              <div className="flex items-center space-x-4">
                {formData.image_url && (
                  <img
                    src={formData.image_url}
                    alt="预览"
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-candy-pink"
                  disabled={uploading}
                  required={!formData.image_url}
                />
              </div>
              {uploading && <p className="text-sm text-gray-500 mt-2">上传中...</p>}
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setIsEditing(null);
                  setFormData({
                    title: '',
                    description: '',
                    image_url: '',
                    category: '其他',
                  });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-4 py-2 bg-candy-pink text-white rounded-lg hover:bg-candy-purple transition-colors disabled:opacity-50"
              >
                {isEditing ? '保存修改' : '添加照片'}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          >
            <div className="relative h-48 mb-4 rounded-lg overflow-hidden">
              <img
                src={photo.image_url}
                alt={photo.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-qingke text-candy-purple mb-2">{photo.title}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
              <span>{new Date(photo.created_at).toLocaleDateString()}</span>
              <span>·</span>
              <span>{photo.category}</span>
            </div>
            <p className="text-gray-700 mb-4">{photo.description}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => handleEdit(photo)}
                className="text-candy-blue hover:text-candy-purple transition-colors"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(photo.id, photo.image_url)}
                className="text-red-500 hover:text-red-700 transition-colors"
              >
                删除
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 