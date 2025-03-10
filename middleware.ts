import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const { data: { session } } = await supabase.auth.getSession();

  // Se não estiver autenticado e tentar acessar uma rota protegida
  if (!session && !req.nextUrl.pathname.startsWith('/')) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  // Se estiver autenticado, buscar o idOwner do membro
  if (session) {
    const { data: memberData } = await supabase
      .from('member')
      .select('idOwner')
      .eq('user_id', session.user.id)
      .single();

    if (memberData) {
      // Adiciona o idOwner ao objeto de resposta
      res.headers.set('x-owner-id', memberData.idOwner.toString());
    }

    // Se estiver autenticado e tentar acessar a página de login
    if (req.nextUrl.pathname === '/') {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/players';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
