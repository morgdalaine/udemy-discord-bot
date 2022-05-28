import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { SlashCommand } from '../types';

const EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
const OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  name: `option${i + 1}`,
  description: `Poll Option #${i + 1}`,
  required: i <= 1,
}));

enum TimeUnit {
  seconds = 'seconds',
  minutes = 'minutes',
  hours = 'hours',
}

export const PollCommand: SlashCommand = {
  command: (() => {
    const slashCommand = new SlashCommandBuilder()
      .addIntegerOption((option) =>
        option
          .setName('time')
          .setDescription('Duration poll is active')
          .setRequired(true)
          .setMinValue(1)
          .setMaxValue(60)
      )
      .addStringOption((option) =>
        option
          .setName('time_unit')
          .setDescription('Time unit of duration')
          .setRequired(true)
          .addChoices([
            [TimeUnit.seconds, TimeUnit.seconds],
            [TimeUnit.minutes, TimeUnit.minutes],
            [TimeUnit.hours, TimeUnit.hours],
          ])
      )
      .setName('poll')
      .setDescription('create a poll');

    OPTIONS.forEach(({ name, description, required }) => {
      slashCommand.addStringOption((option) =>
        option.setName(name).setDescription(description).setRequired(required)
      );
    });

    slashCommand
      .addStringOption((option) => option.setName('title').setDescription('The title of the poll'))
      .addStringOption((option) =>
        option.setName('description').setDescription('The description of the poll')
      )
      .addBooleanOption((option) =>
        option
          .setName('dm_notify')
          .setDescription('Notify via DM if the poll completes successfully')
      );
    return slashCommand;
  })(),
  async run(interaction) {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: `You can only use this command inside a server.`,
      });
    }

    if (!interaction.channel) {
      await interaction.reply({
        content:
          'You can only use this command in a channel, or the client does not have the intents',
      });
    }

    // this is required to ensure guildId and channel exist
    if (interaction.inGuild() && interaction.channel) {
      const buildEmbed = () => {
        let formattedTimeUnit: TimeUnit | string = timeUnit;

        // 1 hours => 1 hour
        if (time === 1) formattedTimeUnit = formattedTimeUnit.slice(0, -1);

        const embed = new MessageEmbed()
          .setAuthor({
            name: member.displayName,
            iconURL: user.displayAvatarURL(),
          })
          .setTitle(title || 'Poll')
          .setDescription(
            description ||
              `React to vote. The poll will be available for ${time} ${formattedTimeUnit}`
          )
          .setColor('AQUA')
          .setFooter({ text: 'In case of draw, a random option is selected to break the tie.' });

        shownOptions.forEach(({ label, value, emoji }) => {
          embed.addField(label, `${emoji} - ${value}`);
        });

        return embed;
      };

      const buildButtons = () => {
        return new MessageActionRow().addComponents([
          new MessageButton().setCustomId('cancel').setLabel('Cancel').setStyle('DANGER'),
          new MessageButton().setCustomId('end-poll').setLabel('End poll now').setStyle('PRIMARY'),
        ]);
      };

      const getTimeInMs = () => {
        switch (timeUnit) {
          case TimeUnit.seconds:
            return time * 1000;
          case TimeUnit.minutes:
            return time * 60 * 1000;
          case TimeUnit.hours:
            return time * 3600 * 1000;
        }
      };

      const buildComponentsCollector = () => {
        return message.createMessageComponentCollector({
          time: timeInMs,
        });
      };

      const buildReactionsCollector = () => {
        const showEmojisMap = shownOptions.reduce<Record<string, boolean>>((map, { emoji }) => {
          map[emoji] = true;
          return map;
        }, {});

        return message.createReactionCollector({
          time: timeInMs,
          filter: (reaction) => {
            const emoji = reaction.emoji.name;

            if (!emoji) return false;
            return !!showEmojisMap[emoji];
          },
        });
      };

      const onComponentsCollect = () => {
        componentsCollector.on('collect', async (componentInteraction) => {
          if (componentInteraction.customId === 'cancel') {
            if (componentInteraction.user.id !== user.id) {
              await componentInteraction.fetchReply();
              await componentInteraction.followUp({
                content: 'You cannot cancel this poll',
                ephemeral: true,
              });
              return;
            }

            reactionCollector.stop('cancel-poll');
            return;
          }

          if (componentInteraction.customId === 'end-poll') {
            if (componentInteraction.user.id !== user.id) {
              await componentInteraction.fetchReply();
              await componentInteraction.followUp({
                content: 'You cannot end this poll',
                ephemeral: true,
              });
              return;
            }

            reactionCollector.stop();
            return;
          }
        });
      };

      const addReactions = async () => {
        for (let i = 0; i < shownOptions.length; i++) {
          if (tooFast) return;
          await message.react(shownOptions[i].emoji);
        }
      };

      const onReactionsEnd = () => {
        reactionCollector.on('end', async (collected, reason) => {
          let mostFrequentEmoji = '';
          let maxCount = 0;

          for (const [key, value] of collected.entries()) {
            if (value.count > maxCount) {
              mostFrequentEmoji = key;
              maxCount = value.count;
            }

            frequencies[key] = value.count;
          }

          tooFast = shownOptions.length !== Object.keys(frequencies).length;
          const winner = shownOptions.find(({ emoji }) => emoji === mostFrequentEmoji);

          embed
            .setColor('GREEN')
            .setDescription(`The poll has ended. The winner is ${winner?.value}!`)
            .setFields([]);

          if (tooFast) {
            embed
              .setDescription(
                'Oops! The poll time is too low for reactions to be added. Consider increasing it.'
              )
              .setColor('RED')
              .setFooter(null);
          } else {
            shownOptions.forEach(({ value, emoji }) => {
              embed.addField(`Votes for "${value}"`, frequencies[emoji].toString());
            });
          }

          if (reason === 'cancel-poll') {
            embed.setColor('RED').setDescription('This poll was cancelled.').setFooter(null);
          }

          await message.reactions.removeAll();
          await message.edit({ embeds: [embed], components: [] });

          if (dmNotify && reason !== 'cancel-poll' && !tooFast) {
            await user.send(`Your poll (${message.url}) ended successfully.`);
          }
        });
      };

      const { options, user, guildId, client, channel } = interaction;

      const guild = interaction.guild || (await client.guilds.fetch(guildId));
      const member = guild.members.cache.get(user.id) || (await guild.members.fetch(user.id));
      const shownOptions = OPTIONS.map(({ name, description }, i) => ({
        emoji: EMOJIS[i],
        label: description,
        value: options.getString(name),
      })).filter(
        (shownOption): shownOption is { emoji: string; label: string; value: string } =>
          !!shownOption.value
      );

      const time = options.getInteger('time', true);
      const timeUnit = options.getString('time_unit', true) as TimeUnit;
      const title = options.getString('title');
      const description = options.getString('description');
      const dmNotify = options.getBoolean('dm_notify') ?? true;

      const embed = buildEmbed();
      const buttons = buildButtons();

      await interaction.reply({
        content: 'Poll successfully created',
      });

      const message = await channel.send({
        embeds: [embed],
        components: [buttons],
      });

      const timeInMs = getTimeInMs();
      const componentsCollector = buildComponentsCollector();
      const reactionCollector = buildReactionsCollector();

      const frequencies: Record<string, number> = {};
      let tooFast = false;

      onReactionsEnd();

      await addReactions();

      onComponentsCollect();
    }
  },
  help: 'Command for creating a poll that can have a time between 1 and 60 seconds/minutes/hours and up to 10 options. You can also add a title, a description and whether or not you want to be notified via DM when the poll ends.',
};
