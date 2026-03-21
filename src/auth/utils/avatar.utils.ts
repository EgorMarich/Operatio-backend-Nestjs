// utils/avatar.utils.ts

const AVATAR_COLORS = [
  '#5B8FF9', '#61DDAA', '#65789B', '#F6BD16',
  '#7262FD', '#78D3F8', '#9661BC', '#F6903D',
  '#008685', '#F08BB4',
];

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('');
}