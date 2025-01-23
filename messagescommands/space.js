const fetch = require('node-fetch');
require('dotenv').config();

const NASA_API_KEY = process.env.NASA_API_KEY;

module.exports = {
    name: '우주',
    description: 'Get the Astronomy Picture of the Day',
    async execute(message) {
        try {
            const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`);
            
            if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.url || !data.title) {
                throw new Error('Invalid data received from NASA API');
            }

            const embed = {
                color: 0x0000FF,
                title: data.title,
                image: { url: data.url }
            };

            await message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error fetching NASA data:', error);
            message.channel.send('There was an error fetching the Astronomy Picture of the Day. Please try again later.');
        }
    },
};
