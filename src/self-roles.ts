import { ColorResolvable } from 'discord.js';

export const SELF_ROLES: Array<{
  emoji: { name: string; id: string };
  name: string;
  color: ColorResolvable;
}> = [
  {
    emoji: { name: 'javascript', id: '980250048749240320' },
    name: 'javascript',
    color: 'YELLOW',
  },
  {
    emoji: { name: 'typescript', id: '980250048099139685' },
    name: 'typescript',
    color: 'AQUA',
  },
  {
    emoji: { name: 'csharp', id: '980250047306403890' },
    name: 'csharp',
    color: 'DARK_VIVID_PINK',
  },
  {
    emoji: { name: 'python', id: '980250048296267797' },
    name: 'python',
    color: 'BLURPLE',
  },
];
