export interface FreeAccount {
  id: number;
  idOwner: number | null;
  login: string;
  password: string;
  class: string;
  rank: string | null;
  password_bank: string | null;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  level: number;
}

export type CreateFreeAccount = Omit<FreeAccount, 'id' | 'created_at' | 'updated_at'>;
export type UpdateFreeAccount = Partial<CreateFreeAccount>;
