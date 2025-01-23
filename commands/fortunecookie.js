const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fortunecookie')
        .setDescription('Get a random fortune cookie message!'),

    async execute(interaction) {
        const apiURL = 'https://aphorismcookie.herokuapp.com/slack';
        const guildId = interaction.guild.id;

        let langData = {};
        try {
            if (fs.existsSync(langFilePath)) {
                const fileData = fs.readFileSync(langFilePath, 'utf-8');
                if (fileData) {
                    langData = JSON.parse(fileData);
                }
            }
        } catch (error) {
            console.error('Error reading language file:', error);
            return interaction.reply({ content: 'An error occurred while loading the language file.', ephemeral: true });
        }

        const lang = langData[guildId] || 'en';

        const messages = {
            en: {
                fetchError: '🥠 Oops! Something went wrong. Please try again later.',
                apiError: '🥠 API request failed. Please try again later.',
                networkError: '🥠 Network error occurred.',
                responseError: '🥠 An error occurred while processing the API response. Please try again later.',
            },
            ko: {
                fetchError: '🥠 Oops! 문제가 발생했습니다. 나중에 다시 시도해주세요.',
                apiError: '🥠 API 요청에 실패했습니다. 나중에 다시 시도해주세요.',
                networkError: '🥠 네트워크 오류가 발생했습니다',
                responseError: '🥠 API 응답을 처리하는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
            },
            ja: {
                fetchError: '🥠 Oops! 何か問題が発生しました。後でもう一度お試しください。',
                apiError: '🥠 APIリクエストに失敗しました。後でもう一度お試しください。',
                networkError: '🥠 ネットワークエラーが発生しました。',
                responseError: '🥠 APIレスポンスの処理中にエラーが発生しました。後でもう一度お試しください。',
            }
        };

        try {
            await interaction.deferReply();

            const response = await fetch(apiURL);

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data || typeof data.text !== 'string') {
                throw new Error('Unexpected API response format.');
            }

            const fortuneText = data.text
                .replace('🥠 your fortune reads: ', '')
                .replace(/'/g, '')
                .trim();

            const embed = new EmbedBuilder()
                .setColor(0xFFD700)
                .setTitle('🥠 Fortune Cookie! 🥠')
                .setDescription(fortuneText)
                .setFooter({ text: '🥠' });

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching fortune cookie:', error);

            if (error instanceof SyntaxError) {
                await interaction.editReply({
                    content: messages[lang].responseError,
                    ephemeral: true,
                });
            } else if (error.message.includes('API returned status')) {
                await interaction.editReply({
                    content: messages[lang].apiError,
                    ephemeral: true,
                });
            } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                await interaction.editReply({
                    content: messages[lang].networkError,
                    ephemeral: true,
                });
            } else {
                await interaction.editReply({
                    content: messages[lang].fetchError,
                    ephemeral: true,
                });
            }
        }
    },
};
