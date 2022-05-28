import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton } from 'discord.js';
import { SlashCommand } from '../types';

const GOOGLE_URL = 'https://google.com';

export const GoogleCommand: SlashCommand = {
  command: new SlashCommandBuilder().setName('google').setDescription('returns a link to google'),
  async run(interaction) {
    const linkButton = new MessageActionRow().addComponents(
      new MessageButton().setURL(GOOGLE_URL).setStyle('LINK').setLabel('visit search')
    );
    await interaction.reply({
      components: [linkButton],
    });
  },
};
