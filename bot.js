const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { REST, Routes } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
client.messageCommands = new Collection();

const clientId = process.env.CLIENT_ID;
const token = process.env.DISCORD_TOKEN;
const adminUserId = '948935502223007805';

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

const commands = [];
for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

const messagesCommandsPath = path.join(__dirname, 'messagescommands');
const messageCommandFiles = fs.readdirSync(messagesCommandsPath).filter(file => file.endsWith('.js'));
for (const file of messageCommandFiles) {
    const filePath = path.join(messagesCommandsPath, file);
    const command = require(filePath);
    client.messageCommands.set(command.name, command);
}

const rest = new REST({ version: '10' }).setToken(token);

async function getExistingCommands() {
    try {
        const currentCommands = await rest.get(Routes.applicationCommands(clientId));
        return currentCommands;
    } catch (error) {
        await sendErrorReport(error);
        return [];
    }
}

async function registerCommands() {
    try {
        const existingCommands = await getExistingCommands();
        for (const command of commands) {
            const existingCommand = existingCommands.find(cmd => cmd.name === command.name);
            if (existingCommand) {
                console.log(`Removing existing command: ${command.name}`);
                await rest.delete(Routes.applicationCommand(clientId, existingCommand.id));
            }
        }
        console.log('Started refreshing global application (/) commands.');
        await rest.put(Routes.applicationCommands(clientId), { body: commands });
        console.log('Successfully reloaded global application (/) commands.');
    } catch (error) {
        await sendErrorReport(error);
    }
}

registerCommands();

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        await sendErrorReport(error, interaction.user);
        await interaction.reply({
            content: '❌ There was an error executing this command.',
            ephemeral: true,
        });
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const prefix = '시아야 ';
    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.messageCommands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (error) {
        await sendErrorReport(error, message.author);
        message.reply('❌ There was an error executing that command.');
    }
});

process.on('unhandledRejection', async error => {
    console.error('Unhandled promise rejection:', error);
    await sendErrorReport(error);
});

process.on('uncaughtException', async error => {
    console.error('Uncaught exception:', error);
    await sendErrorReport(error);
});

async function sendErrorReport(error, user = null) {
    try {
        const adminUser = await client.users.fetch(adminUserId);
        const errorDetails = user
            ? `**User:** ${user.tag} (${user.id})\n**Error:** ${error.stack || error.message}`
            : `**Error:** ${error.stack || error.message}`;

        await adminUser.send({
            content: `🚨 **An error occurred in the bot:**\n${errorDetails}`,
        });
    } catch (dmError) {
        console.error('Failed to send error report:', dmError);
    }
}

client.login(token);