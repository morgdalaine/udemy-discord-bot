import { Client, Intents } from 'discord.js';
import { TOKEN } from './config';
import {
  onInteractionCreate,
  onMessageCreate,
  onMessageReactionAdd,
  onMessageReactionRemove,
  onReady,
} from './listeners';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
  partials: ['CHANNEL'],
});

onReady(client);
onMessageCreate(client);
onInteractionCreate(client);
onMessageReactionAdd(client);
onMessageReactionRemove(client);

client.login(TOKEN);
