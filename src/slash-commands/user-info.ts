import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { SlashCommand } from '../types';

export const UserInfoCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .addUserOption((option) =>
      option.setName('user').setDescription('the user we know about').setRequired(true)
    )
    .setName('user_info')
    .setDescription('returns info of the user'),
  async run(interaction) {
    const user = interaction.options.getUser('user', true);
    const avatar = user.displayAvatarURL();
    const embed = new MessageEmbed()
      .setColor('BLURPLE')
      .setTitle(user.tag)
      .setThumbnail(avatar)
      .addField('Registered at', user.createdAt.toDateString(), true);
    embed.setFooter({ text: `ID: ${user.id}` });
    await interaction.reply({
      embeds: [embed],
    });
  },
};
