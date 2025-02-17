import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useOwner() {
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOwnerId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: memberData } = await supabase
          .from('member')
          .select('idOwner')
          .eq('user_id', session.user.id)
          .single();

        if (memberData) {
          setOwnerId(memberData.idOwner);
        }
      }
      setLoading(false);
    };

    fetchOwnerId();
  }, []);

  return { ownerId, loading };
}
