const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlanguage')
        .setDescription('Set the language for the server.')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('The language to set')
                .addChoices(
                    { name: 'English', value: 'en' },
                    { name: 'Korean(한국어)', value: 'ko' },
                    { name: 'Japanese(日本語)', value: 'ja' }
                )
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const newLang = interaction.options.getString('language');

        const confirmationMessages = {
            en: 'The language for this server has been set to English!',
            ko: '이 서버의 언어가 한국어로 설정되었습니다!',
            ja: 'このサーバーの言語が日本語に設定されました！'
        };

        try {
            let langData = {};
            if (fs.existsSync(langFilePath)) {
                const fileData = fs.readFileSync(langFilePath, 'utf-8');
                if (fileData) {
                    langData = JSON.parse(fileData);
                }
            }

            langData[guildId] = newLang;
            fs.writeFileSync(langFilePath, JSON.stringify(langData, null, 2));

            const confirmationMessage = confirmationMessages[newLang] || 'Language updated!';
            await interaction.reply(confirmationMessage);

        } catch (error) {
            console.error('Error updating language setting:', error);

            let errorMessage = '❌ Error updating language settings.';

            if (error.code === 'ENOENT') {
                errorMessage = '❌ Language file not found. Please check file permissions or file path.';
            } else if (error.code === 'EACCES') {
                errorMessage = '❌ Permission denied. Unable to update language file. Please check file permissions.';
            } else if (error instanceof SyntaxError) {
                errorMessage = '❌ Error processing the language data. Please check the file format.';
            } else {
                errorMessage = '❌ An unexpected error occurred while updating the language settings.';
            }

            await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }
    }
};
