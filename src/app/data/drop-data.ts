export class DropData {
  id: string;
  placement: Placement;

  constructor(id: string, placement: Placement = Placement.None) {
    this.id = id;
    this.placement = placement;
  }
}

export enum Placement {
  None,
  Over,
  Under,
  Merge,
}
