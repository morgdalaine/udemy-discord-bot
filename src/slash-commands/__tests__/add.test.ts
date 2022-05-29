import { CommandInteraction } from 'discord.js';
import { AddCommand } from '../add';

test('it relies with the sum of two numbers', async () => {
  const getNumber = jest.fn().mockReturnValueOnce(1).mockReturnValueOnce(5);
  const interaction = {
    options: {
      getNumber,
    },
    reply: jest.fn(),
  } as unknown as CommandInteraction; // this sucks, but it's so time consuming to build our own mock

  await AddCommand.run(interaction);
  expect(getNumber).toHaveBeenCalledTimes(2);
  expect(interaction.reply).toHaveBeenCalledWith({ content: '1 + 5 = 6' });
});
