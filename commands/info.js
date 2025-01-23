const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get bot information'),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const messages = {
            en: {
                title: 'Bot Information',
                description: (ping, guildCount) => `Ping: ${ping}ms\nServers: ${guildCount}`,
                error: 'There was an error fetching the bot information. Please try again later.',
                inviteLabel: 'Invite Me!',
            },
            ko: {
                title: '봇 정보',
                description: (ping, guildCount) => `핑: ${ping}ms\n서버 수: ${guildCount}`,
                error: '봇 정보를 가져오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
                inviteLabel: '초대하기!',
            },
            ja: {
                title: 'ボット情報',
                description: (ping, guildCount) => `ピング: ${ping}ms\nサーバー数: ${guildCount}`,
                error: 'ボット情報の読み込み中にエラーが発生しました。 後でもう一度お試しください。',
                inviteLabel: 'ボット招待！',
            },
        };

        try {
            let langData = {};
            if (fs.existsSync(langFilePath)) {
                const fileData = fs.readFileSync(langFilePath, 'utf-8');
                if (fileData) {
                    langData = JSON.parse(fileData);
                }
            }

            if (!langData[guildId]) {
                langData[guildId] = 'en';
                fs.writeFileSync(langFilePath, JSON.stringify(langData, null, 2));
            }

            const lang = langData[guildId];
            const localizedMessages = messages[lang] || messages['en'];

            const ping = interaction.client.ws.ping;
            const guildCount = interaction.client.guilds.cache.size;
            const inviteLink = `https://discord.com/oauth2/authorize?client_id=${interaction.client.user.id}`;

            const embedDescription = localizedMessages.description(ping, guildCount);

            const embed = new EmbedBuilder()
                .setTitle(localizedMessages.title)
                .setDescription(embedDescription)
                .setColor('#0099ff');

            const inviteButton = new ButtonBuilder()
                .setLabel(localizedMessages.inviteLabel)
                .setStyle(5)
                .setURL(inviteLink);

            const row = new ActionRowBuilder().addComponents(inviteButton);

            await interaction.reply({
                embeds: [embed],
                components: [row],
            });
        } catch (error) {
            console.error('Error executing /info command:', error);

            let errorMessage = messages['en'].error;
            if (error.message.includes('ENOTFOUND')) {
                errorMessage = 'Network error occurred. Please check your connection and try again.';
            } else if (error instanceof SyntaxError) {
                errorMessage = 'There was an issue processing your request.';
            }

            await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }
    },
};
