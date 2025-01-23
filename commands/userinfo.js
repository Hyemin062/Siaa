const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../lang.json');
const membershipFilePath = path.join(__dirname, '../membership.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display user information.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to display information for')
                .setRequired(false)),
    
    async execute(interaction) {
        await interaction.deferReply();

        const guildId = interaction.guild.id;

        const messages = {
            en: {
                title: (tag) => `${tag}'s Information`,
                userId: 'User ID',
                joined: 'Joined Server At',
                created: 'Account Created At',
                membership: 'Membership',
                footer: 'User Information',
                error: 'There was an error retrieving the user information. Please try again later.',
            },
            ko: {
                title: (tag) => `${tag}의 정보`,
                userId: '사용자 ID',
                joined: '서버 가입 일시',
                created: '계정 생성 일시',
                membership: '멤버십',
                footer: '사용자 정보',
                error: '사용자 정보를 가져오는 중 오류가 발생했습니다. 나중에 다시 시도해주세요.',
            },
            ja: {
                title: (tag) => `${tag}さんの情報`,
                userId: 'ユーザーID',
                joined: 'サーバー参加日',
                created: 'アカウント作成日',
                membership: 'メンバーシップ',
                footer: 'ユーザー情報',
                error: 'ユーザー情報の取得中にエラーが発生しました。 後でもう一度お試しください。',
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

            const user = interaction.options.getUser('user') || interaction.user;
            const member = await interaction.guild.members.fetch(user.id);

            let membershipStatus = 'No membership';
            let membershipData = {};
            if (fs.existsSync(membershipFilePath)) {
                const fileData = fs.readFileSync(membershipFilePath, 'utf-8');
                membershipData = JSON.parse(fileData);

                if (membershipData[user.id]) {
                    const memberInfo = membershipData[user.id];
                    membershipStatus = memberInfo.remainingDays === 'infinite' ? 'Infinite Membership' : `${memberInfo.remainingDays} days remaining`;
                }
            }

            const embed = {
                color: 0x0099ff,
                title: localizedMessages.title(user.tag),
                thumbnail: {
                    url: user.displayAvatarURL({ dynamic: true, size: 2048 }),
                },
                fields: [
                    {
                        name: localizedMessages.userId,
                        value: user.id,
                        inline: true,
                    },
                    {
                        name: localizedMessages.joined,
                        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
                        inline: true,
                    },
                    {
                        name: localizedMessages.created,
                        value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                        inline: true,
                    },
                    {
                        name: localizedMessages.membership,
                        value: membershipStatus,
                        inline: true,
                    },
                ],
                footer: {
                    text: localizedMessages.footer,
                },
            };

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching user information:', error);

            const lang = langData[guildId] || 'en';
            const localizedMessages = messages[lang] || messages['en'];

            if (error instanceof SyntaxError) {
                await interaction.editReply('Error parsing data. Please try again later.');
            } else if (error.code === 'ENOENT') {
                await interaction.editReply('File not found. Please try again later.');
            } else {
                await interaction.editReply(localizedMessages.error);
            }
        }
    },
};
