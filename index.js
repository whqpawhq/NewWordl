require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`✅ Bot đã đăng nhập thành ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (!message.content.startsWith('!play') || message.author.bot) return;

  const args = message.content.split(' ');
  const url = args[1];
  if (!url || !ytdl.validateURL(url)) {
    return message.reply('❌ Gửi link YouTube hợp lệ đi bạn ơi!');
  }

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    return message.reply('🎧 Vào kênh voice trước khi phát nhạc nhé!');
  }

  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const stream = ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 });
    const resource = createAudioResource(stream);
    const player = createAudioPlayer();

    player.play(resource);
    connection.subscribe(player);

    player.on(AudioPlayerStatus.Idle, () => {
      connection.destroy();
    });

    message.reply(`🎶 Đang phát: ${url}`);
  } catch (error) {
    console.error(error);
    message.reply('⚠️ Lỗi khi phát nhạc!');
  }
});

client.login(process.env.TOKEN);
