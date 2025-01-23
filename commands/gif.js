const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gif')
        .setDescription('Search for a random GIF')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The search term for the GIF')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const apiKey = process.env.TENOR_API_KEY;
        const guildId = interaction.guild.id;

        const messages = {
            en: {
                noResults: 'No GIFs found for that search term!',
                fetchError: 'There was an error fetching GIFs from the API. Please try again later.',
                unexpectedError: 'An unexpected error occurred. Please try again later.',
                networkError: 'Network error occurred. Please check your internet connection.',
                apiError: 'Error fetching from API. Please check the request parameters.'
            },
            ko: {
                noResults: '검색어에 해당하는 GIF가 없습니다!',
                fetchError: 'GIF를 가져오는 중 오류가 발생했습니다. 나중에 다시 시도하세요.',
                unexpectedError: '예기치 않은 오류가 발생했습니다. 나중에 다시 시도하세요.',
                networkError: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.',
                apiError: 'API에서 오류가 발생했습니다. 요청 파라미터를 확인해주세요.'
            },
            ja: {
                noResults: '検索されたgif(ジフ)がありません。',
                fetchError: 'GIF(ジフ)の取得中にエラーが発生しまし。 後でもう一度お試しください。',
                unexpectedError: '予期しないエラーが発生しました。後でもう一度お試しください。',
                networkError: 'ネットワークエラーが発生しました。インターネット接続を確認してもう一度お試しください。',
                apiError: 'APIでエラーが発生しました。リクエストパラメータを確認してください。'
            }
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

            const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=10`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Error fetching GIFs: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.results || data.results.length === 0) {
                return interaction.reply(localizedMessages.noResults);
            }

            const gif = data.results[Math.floor(Math.random() * data.results.length)].url;
            await interaction.reply(gif);

        } catch (error) {
            console.error(error);

            if (error.message.includes('fetching GIFs')) {
                await interaction.reply(localizedMessages.apiError);
            } else if (error.message.includes('NetworkError')) {
                await interaction.reply(localizedMessages.networkError);
            } else if (error instanceof SyntaxError) {
                await interaction.reply(localizedMessages.fetchError);
            } else {
                await interaction.reply(localizedMessages.unexpectedError);
            }
        }
    }
};
