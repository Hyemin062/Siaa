const math = require('mathjs');

module.exports = {
    name: '계산',
    async execute(message, args) {
        const expression = args.join(' ');

        const errorMessage = '❌';

        try {
            const result = math.evaluate(expression);
            await message.reply(`${result}`);
        } catch (error) {
            console.error('err! ! ! ! ! ! ! : ', error);
            await message.reply(errorMessage);
        }
    },
};
