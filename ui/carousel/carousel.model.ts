export interface CarouselPill {
  id: string;
  label: string;
  avatar?: string;
  ariaLabel?: string;
}

export interface CarouselSlide<T> {
  slideId: string;
  realIndex: number;
  item: T;
  isClone: boolean;
}
