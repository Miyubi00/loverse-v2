export interface ShowcaseSpinCommand {
  id: number;
  direction: -1 | 0 | 1;
  nextIndex: number;
  velocity: number;
}

export interface PhoneShowcaseMotion {
  dragging: boolean;
  dragRotation: number;
  commandId: number;
  command: ShowcaseSpinCommand | null;
  requestFrame?: () => void;
}
