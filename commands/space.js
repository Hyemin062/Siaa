const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

const NASA_API_KEY = process.env.NASA_API_KEY;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('space')
        .setDescription('Get the Astronomy Picture of the Day'),

    async execute(interaction) {
        await interaction.deferReply();

        try {
            const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.url || !data.title) {
                throw new Error('Invalid data received from NASA API');
            }

            const spaceEmbed = {
                color: 0x0000FF,
                title: data.title,
                image: {
                    url: data.url,
                },
            };

            await interaction.editReply({ embeds: [spaceEmbed] });

        } catch (error) {
            console.error(error);

            if (error.message.includes('API responded with status')) {
                await interaction.editReply('There was an issue fetching data from NASA. Please try again later.');
            } else if (error.message === 'Invalid data received from NASA API') {
                await interaction.editReply('The data received from NASA is invalid. Please try again later.');
            } else if (error.message.includes('ENOTFOUND')) {
                await interaction.editReply('Network error: Unable to reach NASA API. Please check your connection and try again.');
            } else if (error.message.includes('ECONNREFUSED')) {
                await interaction.editReply('Connection refused: Unable to connect to NASA API. Please try again later.');
            } else if (error instanceof SyntaxError) {
                await interaction.editReply('Error parsing response from NASA. Please try again later.');
            } else {
                await interaction.editReply('There was an error fetching the space image. Please try again later.');
            }
        }
    },
};
