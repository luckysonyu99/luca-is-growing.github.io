import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MAX_LOGIN_ATTEMPTS = 3;
const BLOCK_DURATION = 30 * 60 * 1000; // 30分钟

export async function middleware(req: NextRequest) {
  try {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    // 检查用户是否已登录
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }

    // 如果是访问管理后台相关页面
    if (req.nextUrl.pathname.startsWith('/admin')) {
      // 如果未登录，重定向到登录页面
      if (!session) {
        console.log('No session found, redirecting to login');
        return NextResponse.redirect(new URL('/admin/login', req.url));
      }

      console.log('Current user:', session.user);

      try {
        // 验证用户是否是管理员
        const { data: userData, error: userError } = await supabase
          .from('admin_users')
          .select('user_id, email')
          .eq('user_id', session.user.id)
          .single();

        console.log('Admin check result:', { userData, userError });

        if (userError) {
          console.error('Admin check error:', userError);
          // 如果表不存在，创建表
          if (userError.code === '42P01') {
            const { error: createTableError } = await supabase.rpc('create_admin_users_table');
            if (createTableError) {
              console.error('Create table error:', createTableError);
              return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
            }
            // 重试查询
            const { data: retryData, error: retryError } = await supabase
              .from('admin_users')
              .select('user_id, email')
              .eq('user_id', session.user.id)
              .single();
            
            if (retryError || !retryData) {
              return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
            }
            return res;
          }
          return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
        }

        // 如果不是管理员，重定向到未授权页面
        if (!userData) {
          console.log('User not found in admin_users table:', session.user.id);
          return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
        }

        // 如果已登录管理员访问登录页面，重定向到管理后台
        if (req.nextUrl.pathname === '/admin/login') {
          return NextResponse.redirect(new URL('/admin', req.url));
        }
      } catch (error) {
        console.error('Admin verification error:', error);
        return NextResponse.redirect(new URL('/admin/unauthorized', req.url));
      }
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
}

// 配置需要进行中间件处理的路径
export const config = {
  matcher: [
    '/admin/:path*',
  ],
}; 