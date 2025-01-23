const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Delete messages from the channel. (Require: MANAGE_MESSAGES)')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const amount = interaction.options.getInteger('amount');

        const messages = {
            en: {
                noPermission: 'You do not have permission to manage messages!',
                deleted: (count) => `${count} message(s) have been deleted.`,
                error14Days: 'You cannot delete messages older than 14 days.',
                errorPartialDelete: 'Some messages could not be deleted.',
                generalError: 'There was an error trying to delete messages.',
                rateLimit: 'You are being rate-limited. Please try again later.',
                unknownError: 'An unknown error occurred.'
            },
            ko: {
                noPermission: '메시지를 관리할 권한이 없습니다!',
                deleted: (count) => `${count}개의 메시지가 삭제되었습니다.`,
                error14Days: '14일 이상 지난 메시지는 삭제할 수 없습니다.',
                errorPartialDelete: '일부 메시지를 삭제할 수 없습니다.',
                generalError: '메시지를 삭제하는 중 오류가 발생했습니다.',
                rateLimit: '잠시 후 다시 시도해주세요. 너무 많은 요청을 보냈습니다.',
                unknownError: '알 수 없는 오류가 발생했습니다.'
            },
            ja: {
                noPermission: '権限が足りません。',
                deleted: (count) => `${count}個のメッセージが削除されました。`,
                error14Days: '14日が過ぎたメッセージは削除できません。',
                errorPartialDelete: '一部のメッセージが削除されていません。',
                generalError: 'メッセージの削除中にエラーが発生しました。',
                rateLimit: 'しばらくしてから再度お試しください。',
                unknownError: '不明なエラーが発生しました。'
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

            if (!interaction.member.permissions.has('MANAGE_MESSAGES')) {
                return interaction.reply({ content: localizedMessages.noPermission, ephemeral: true });
            }

            const deletedMessages = await interaction.channel.bulkDelete(amount, true);
            await interaction.reply({ content: localizedMessages.deleted(deletedMessages.size), ephemeral: true });
        } catch (error) {
            console.error(error);

            if (error.code === '50013') {
                await interaction.reply({ content: messages[lang]?.error14Days || messages['en'].error14Days, ephemeral: true });
            } else if (error.code === '50035') {
                await interaction.reply({ content: messages[lang]?.errorPartialDelete || messages['en'].errorPartialDelete, ephemeral: true });
            } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                await interaction.reply({ content: messages[lang]?.networkError || messages['en'].networkError, ephemeral: true });
            } else if (error.code === 'RATELIMIT') {
                await interaction.reply({ content: messages[lang]?.rateLimit || messages['en'].rateLimit, ephemeral: true });
            } else {
                await interaction.reply({ content: messages[lang]?.unknownError || messages['en'].unknownError, ephemeral: true });
            }
        }
    }
};
