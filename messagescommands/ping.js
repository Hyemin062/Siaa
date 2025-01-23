const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: '핑',
    execute(message) {
        const restLatency = Date.now() - message.createdTimestamp;
        
        const gatewayLatency = message.client.ws.ping;
        
        const embed = new EmbedBuilder()
            .setTitle('핑 정보')
            .addFields(
                { name: 'REST 핑', value: `${restLatency}ms`, inline: true },
                { name: 'Gateway 핑', value: `${gatewayLatency}ms`, inline: true }
            )
            .setColor(0x00AE86);

        message.reply({ embeds: [embed] });
    },
};
