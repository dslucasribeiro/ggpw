export interface FreeAccount {
  id: number;
  idOwner: number | null;
  login: string;
  password: string;
  class: string;
  level: number;
  rank: string | null;
  password_bank: string | null;
  is_available: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateFreeAccount = Omit<FreeAccount, 'id' | 'created_at' | 'updated_at'>;

export type UpdateFreeAccount = Partial<Omit<FreeAccount, 'id' | 'created_at' | 'updated_at'>>;
