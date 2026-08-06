import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Binary, Orbit, Activity, Flame } from 'lucide-react';
import TextMatrixHeart from './TextMatrixHeart';
import OrbitHeart from './OrbitHeart';
import PulseHeart from './PulseHeart';
import EmberHeart from './EmberHeart';

export interface HeartAnimationDef {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  Component: ComponentType;
}

export const HEART_ANIMATIONS: HeartAnimationDef[] = [
  {
    id: 'matrix',
    name: 'Text Matrix',
    description: '"i love you" tersusun berlapis membentuk siluet hati.',
    icon: Binary,
    Component: TextMatrixHeart,
  },
  {
    id: 'orbit',
    name: '3D Orbit',
    description: 'Awan partikel 3D yang bisa diputar, melayang di antara bintang.',
    icon: Orbit,
    Component: OrbitHeart,
  },
  {
    id: 'pulse',
    name: 'Heartbeat Pulse',
    description: 'Denyut ala monitor EKG dengan gema hati yang meluas.',
    icon: Activity,
    Component: PulseHeart,
  },
  {
    id: 'embers',
    name: 'Floating Embers',
    description: 'Kunang-kunang cahaya yang perlahan berkumpul jadi hati.',
    icon: Flame,
    Component: EmberHeart,
  },
];

export const DEFAULT_ANIMATION_ID = HEART_ANIMATIONS[0].id;

export function getAnimationById(id?: string): HeartAnimationDef {
  return HEART_ANIMATIONS.find((a) => a.id === id) ?? HEART_ANIMATIONS[0];
}
