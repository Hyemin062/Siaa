const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const membershipFilePath = path.resolve(__dirname, '../membership.json');
const memServerFilePath = path.resolve(__dirname, '../memserver.json');
const langFilePath = path.resolve(__dirname, '../lang.json');

const catApiUrl = 'https://api.thecatapi.com/v1/images/search';

const messages = {
    en: {
        noMembership: '🚫 You do not have an active membership. This command is restricted to members only.',
        fetchingError: '❌ An error occurred while fetching the cat picture. Please try again later.',
        fetchTimeout: '❌ The request to fetch the cat picture timed out. Please try again later.',
        noData: '❌ No cat picture found. Please try again later.',
        embedTitle: '🐱 Cat! 🐱',
        fileReadError: '❌ There was an error reading the membership or language file.',
        apiError: '❌ There was an issue with the API request. Please try again later.',
        networkError: '❌ Network error occurred.',
        unexpectedError: '❌ An unexpected error occurred. Please try again later.'
    },
    ko: {
        noMembership: '🚫 활성화된 멤버십이 없습니다. 이 명령어는 멤버십 유저만 사용할 수 있습니다.',
        fetchingError: '❌ 고양이 사진을 가져오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
        fetchTimeout: '❌ 고양이 사진을 가져오는 요청시간이 초과되었습니다. 나중에 다시 시도해주세요.',
        noData: '❌ 고양이 사진을 찾을 수 없습니다. 나중에 다시 시도해주세요.',
        embedTitle: '🐱 고양이! 🐱',
        fileReadError: '❌ 멤버십 또는 언어 파일을 읽는 중 오류가 발생했습니다.',
        apiError: '❌ API 요청에 문제가 발생했습니다. 나중에 다시 시도해주세요.',
        networkError: '❌ 네트워크 오류가 발생했습니다.',
        unexpectedError: '❌ 예기치 않은 오류가 발생했습니다. 나중에 다시 시도해주세요.'
    },
    ja: {
        noMembership: '🚫 有効なメンバーシップがありません。このコマンドはメンバー専用です。',
        fetchingError: '❌ 猫の写真を取得中にエラーが発生しました。後でもう一度お試しください。',
        fetchTimeout: '❌ 猫の写真を取得するリクエストがタイムアウトしました。後でもう一度お試しください。',
        noData: '❌ 猫の写真が見つかりませんでした。後でもう一度お試しください。',
        embedTitle: '🐱 猫！ 🐱',
        fileReadError: '❌ メンバーシップまたは言語ファイルの読み込み中にエラーが発生しました。',
        apiError: '❌ APIリクエストに問題が発生しました。後でもう一度お試しください。',
        networkError: '❌ ネットワークエラーが発生しました。',
        unexpectedError: '❌ 予期しないエラーが発生しました。後でもう一度お試しください。'
    }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Get a random cat picture!'),

    async execute(interaction) {
        const serverId = interaction.guild.id;
        const userId = interaction.user.id;

        let langData = {};
        try {
            if (fs.existsSync(langFilePath)) {
                const langFileContent = fs.readFileSync(langFilePath, 'utf-8');
                langData = JSON.parse(langFileContent);
            }
        } catch (error) {
            console.error('Error reading language file:', error);
            return interaction.reply(messages[lang].fileReadError);
        }

        const lang = langData[serverId] || 'en';
        const localizedMessages = messages[lang] || messages['en'];

        let membershipData = {};
        let memServerData = {};
        try {
            if (fs.existsSync(membershipFilePath)) {
                membershipData = JSON.parse(fs.readFileSync(membershipFilePath, 'utf-8'));
            }
            if (fs.existsSync(memServerFilePath)) {
                memServerData = JSON.parse(fs.readFileSync(memServerFilePath, 'utf-8'));
            }
        } catch (error) {
            console.error('Error reading membership data:', error);
            return interaction.reply(localizedMessages.fileReadError);
        }

        const isUserMember = membershipData[userId] && (membershipData[userId].remainingDays === 'infinite' || membershipData[userId].remainingDays > 0);
        const isServerMember = memServerData[serverId] && memServerData[serverId].active;

        if (!isUserMember && !isServerMember) {
            return interaction.reply({
                content: localizedMessages.noMembership,
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        try {
            const response = await axios.get(catApiUrl);
            const catData = response.data[0];

            if (!catData || !catData.url) {
                return interaction.editReply(localizedMessages.noData);
            }

            const embed = new EmbedBuilder()
                .setTitle(localizedMessages.embedTitle)
                .setImage(catData.url)
                .setColor(0x1abc9c);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching cat picture:', error);

            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                await interaction.editReply(localizedMessages.networkError);
            }
            else if (error.code === 'ECONNABORTED' || error.response === undefined) {
                await interaction.editReply(localizedMessages.fetchTimeout);
            }
            else if (error.response && error.response.status === 404) {
                await interaction.editReply(localizedMessages.fetchingError);
            }
            else if (error.response && error.response.status >= 500) {
                await interaction.editReply(localizedMessages.apiError);
            }
            else {
                await interaction.editReply(localizedMessages.unexpectedError);
            }
        }
    },
};
