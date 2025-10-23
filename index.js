const { Client, GatewayIntentBits, EmbedBuilder } = require("discord.js");
const { Manager } = require("erela.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});

const nodes = [
  {
    host: process.env.LAVALINK_HOST,
    port: Number(process.env.LAVALINK_PORT),
    password: process.env.LAVALINK_PASSWORD,
    secure: process.env.LAVALINK_SECURE === "true",
  },
];

client.manager = new Manager({
  nodes,
  send: (id, payload) => {
    const guild = client.guilds.cache.get(id);
    if (guild) guild.shard.send(payload);
  },
});

client.on("ready", () => {
  console.log(`✅ Bot đã đăng nhập với tên ${client.user.tag}`);
  client.manager.init(client.user.id);
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith("!")) return;

  const [cmd, ...args] = message.content.slice(1).split(/ +/);

  if (cmd === "play") {
    const query = args.join(" ");
    if (!query) return message.reply("❌ Nhập tên hoặc link bài hát!");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply("❌ Vào voice channel trước!");

    const player = client.manager.create({
      guild: message.guild.id,
      voiceChannel: voiceChannel.id,
      textChannel: message.channel.id,
    });

    player.connect();

    const res = await client.manager.search(query, message.author);
    if (!res.tracks.length) return message.reply("❌ Không tìm thấy bài hát!");

    player.queue.add(res.tracks[0]);
    message.reply(`🎵 Đã thêm: **${res.tracks[0].title}**`);

    if (!player.playing && !player.paused && !player.queue.size)
      player.play();
  }

  if (cmd === "skip") {
    const player = client.manager.players.get(message.guild.id);
    if (!player) return message.reply("❌ Không có bài nào đang phát!");
    player.stop();
    message.reply("⏭️ Đã chuyển bài!");
  }

  if (cmd === "stop") {
    const player = client.manager.players.get(message.guild.id);
    if (!player) return message.reply("❌ Không có nhạc để dừng!");
    player.destroy();
    message.reply("⏹️ Đã dừng và rời kênh!");
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
