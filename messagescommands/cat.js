const axios = require('axios');

const catApiUrl = 'https://api.thecatapi.com/v1/images/search';

module.exports = {
    name: '고양이',
    async execute(message, args) {
        try {
            const response = await axios.get(catApiUrl);
            const catData = response.data[0];

            if (!catData || !catData.url) {
                return message.reply('❌ error! ❌');
            }

            await message.reply({
                embeds: [{
                    title: '🐱 고양이! 🐱',
                    image: { url: catData.url },
                    color: 0x1abc9c,
                }],
            });
        } catch (error) {
            console.error('고양이 사진 가져오기 오류:', error);

            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                await message.reply('❌ 네트워크 오류가 발생했습니다.');
            } else if (error.code === 'ECONNABORTED' || !error.response) {
                await message.reply('❌ 요청시간이 초과되었습니다.');
            } else if (error.response && error.response.status === 404) {
                await message.reply('❌ 오류가 발생했습니다.');
            } else if (error.response && error.response.status >= 500) {
                await message.reply('❌ 문제가 발생했습니다.');
            } else {
                await message.reply('❌ 예기치 않은 오류가 발생했습니다.');
            }
        }
    },
};
