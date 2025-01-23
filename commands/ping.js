const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Returns the latency'),

    async execute(interaction) {
        const guildId = interaction.guild.id;

        const messages = {
            en: `🏓 Pong! Latency is ${Date.now() - interaction.createdTimestamp}ms.`,
            ko: `🏓 퐁! 현재 지연 시간은 ${Date.now() - interaction.createdTimestamp}ms입니다.`,
            ja: `🏓 ポン！現在のレイテンシーは ${Date.now() - interaction.createdTimestamp}ms です。`
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


            const message = messages[lang] || messages['en'];

            await interaction.reply(message);

        } catch (error) {
            console.error('Error fetching language setting:', error);
            await interaction.reply('❌ Error fetching language settings.');
        }
    }
};
