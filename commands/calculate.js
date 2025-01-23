const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const math = require('mathjs');

const langFilePath = path.join(__dirname, '../lang.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('calculate')
        .setDescription('Perform a calculation')
        .addStringOption(option =>
            option.setName('expression')
                .setDescription('The mathematical expression to calculate')
                .setRequired(true)),

    async execute(interaction) {
        const expression = interaction.options.getString('expression');
        const guildId = interaction.guild.id;

        const defaultErrorMessages = {
            en: '❌ Invalid expression. Please enter a valid mathematical expression.',
            ko: '❌ 잘못된 표현입니다. 수식을 확인해주세요.',
            ja: '❌ 間違った表現です。 数字または演算子のみが許可されます。',
        };

        let langData = {};
        try {
            if (fs.existsSync(langFilePath)) {
                const fileData = fs.readFileSync(langFilePath, 'utf-8');
                langData = JSON.parse(fileData);
            }
        } catch (error) {
            console.error('Error reading lang.json:', error);
        }

        const lang = langData[guildId] || 'en';
        const errorMessages = defaultErrorMessages;

        try {
            const result = math.evaluate(expression);
            await interaction.reply(`${result}`);
        } catch (error) {
            console.error('Error during calculation:', error);

            const errorMessage = errorMessages[lang] || errorMessages['en'];
            await interaction.reply({
                content: errorMessage,
                ephemeral: true,
            });
        }
    },
};
