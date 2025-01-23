const axios = require('axios');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: '퀴즈',
    async execute(message) {
        try {
            const response = await axios.get('https://opentdb.com/api.php', {
                params: {
                    amount: 1,
                    category: 9,
                    type: 'multiple'
                }
            });

            const questionData = response.data.results[0];
            const question = questionData.question;
            const correctAnswer = questionData.correct_answer;
            const allAnswers = [...questionData.incorrect_answers, correctAnswer];

            const shuffledAnswers = allAnswers.sort(() => Math.random() - 0.5);
            const correctIndex = shuffledAnswers.indexOf(correctAnswer) + 1;

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('퀴즈!')
                .setDescription(question)
                .addFields(
                    shuffledAnswers.map((answer, index) => ({
                        name: `**${index + 1}:**`,
                        value: answer,
                        inline: true
                    }))
                )
                .setFooter({ text: '정답 번호를 입력하세요! (1~4)' });

            await message.channel.send({ embeds: [embed] });

            const filter = response => {
                return response.author.id === message.author.id &&
                    !isNaN(response.content) && 
                    Number(response.content) >= 1 &&
                    Number(response.content) <= shuffledAnswers.length;
            };

            const collected = await message.channel.awaitMessages({ filter, time: 30000, max: 1, errors: ['time'] });
            const answerIndex = parseInt(collected.first().content);

            if (answerIndex === correctIndex) {
                message.reply('🎉 정답입니다!');
            } else {
                message.reply(`❌ 틀렸습니다. 정답은 **${correctIndex}: ${correctAnswer}**입니다.`);
            }
        } catch (err) {
            console.error(err);
            message.reply('퀴즈를 가져오는 데 문제가 발생했습니다.');
        }
    }
};
