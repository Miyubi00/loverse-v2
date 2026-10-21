export interface ShowcaseTransitionCommand {
  id: number;
  direction: -1 | 0 | 1;
  nextIndex: number;
  velocity: number;
}

export interface PhoneShowcaseMotion {
  dragging: boolean;
  dragOffset: number;
  commandId: number;
  command: ShowcaseTransitionCommand | null;
  requestFrame?: () => void;
}
