export type NoteName = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'

export interface StaffNote {
  readonly step: number
  readonly name: NoteName
  readonly octave: number
}
