'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('Admin page state:', { user, loading });
    
    if (!loading && !user) {
      console.log('No user found, redirecting to login...');
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    console.log('Admin page loading...');
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-candy-pink"></div>
      </div>
    );
  }

  if (!user) {
    console.log('Admin page no user...');
    return null;
  }

  console.log('Admin page rendering with user:', user);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">管理面板 ⚙️</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/milestones"
          className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-white/20"
        >
          <h2 className="text-xl font-semibold mb-2">里程碑管理 📝</h2>
          <p className="text-gray-600">添加、编辑和删除里程碑 ✨</p>
        </Link>
        <Link
          href="/admin/gallery"
          className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-white/20"
        >
          <h2 className="text-xl font-semibold mb-2">相册管理 📸</h2>
          <p className="text-gray-600">上传、编辑和删除照片 🖼️</p>
        </Link>
        <Link
          href="/admin/settings"
          className="bg-white/70 backdrop-blur-sm rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border border-white/20"
        >
          <h2 className="text-xl font-semibold mb-2">设置 ⚙️</h2>
          <p className="text-gray-600">管理网站设置和个人信息 🔧</p>
        </Link>
      </div>
    </div>
  );
} 