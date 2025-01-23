const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: '정보',
    description: '봇과 관련된 정보를 표시합니다.',
    async execute(message) {
        const client = message.client;
        const restLatency = Date.now() - message.createdTimestamp;
        const gatewayLatency = client.ws.ping;
        const serverCount = client.guilds.cache.size;
        const userCount = client.users.cache.size;


        const embed = new EmbedBuilder()
            .setTitle('봇 정보')
            .setColor(0x3498db)
            .setDescription(`
                **개발자**: 여러명

                **서버 정보**:
                서버 수: ${serverCount}개
                총 유저 수: ${userCount}명

                **상태 정보**:
                REST핑: ${restLatency}ms 
                Gateway핑: ${gatewayLatency}ms

            `);

        message.channel.send({ embeds: [embed] });
    },
};
