import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Player {
  id: number;
  nick: string;
  classe: string;
  posicao: string;
  nivel: number;
}

interface FormationPlayer {
  id: number;
  tw_id: number;
  player_id: number | null;
  position: number;
  table_name: string;
  status: string | null;
  player?: Player;
}

interface SettingsState {
  clanName: string
  tableNames: string[]
  formationPlayers: FormationPlayer[]
  setClanName: (name: string) => void
  setTableNames: (names: string[]) => void
  setFormationPlayers: (players: FormationPlayer[]) => void
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      clanName: '',
      tableNames: [
        'GT1',
        'GT2',
        'COMBO',
        'Apoio 1',
        'Apoio 2',
        'Apoio 3',
        'Back 1',
        'Back 2',
        'Kill CT',
        'Kill EP'
      ],
      formationPlayers: [],
      setClanName: (name) => set({ clanName: name }),
      setTableNames: (names) => set({ tableNames: names }),
      setFormationPlayers: (players) => set({ formationPlayers: players }),
    }),
    {
      name: 'settings-storage',
    }
  )
)
