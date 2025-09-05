const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField,ActionRowBuilder, ButtonBuilder, ButtonStyle,  SlashCommandBuilder, REST, Routes  } = require("discord.js");

class EzDiscord {
    constructor(token) {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates,
                GatewayIntentBits.GuildPresences,
                GatewayIntentBits.GuildInvites,

            ],
        });
        this.token = token;
        this.prefix = null;

        this.invites = new Map(); 
this.lastInviter = null; 

this.slashCommands = [];
    this.slashCommandHandlers = new Map();


    }

    
    login() {
        return this.client.login(this.token);
    }
    ready(callback) {
        this.client.once("ready", async () => {
            await this.loadInvites();
            
            
            this.client.on('interactionCreate', async (interaction) => {
                if (!interaction.isChatInputCommand()) return;
                
                const handler = this.slashCommandHandlers.get(interaction.commandName);
                if (handler) {
                    await handler(interaction);
                }
            });
            
            callback();
        });
    }


    
    on(event, callback) {
        this.client.on(event, callback);
    }

    handleErrors() {
        this.client.on("error", console.error);
        this.client.on("warn", console.warn);
        this.client.on("unhandledRejection", console.error);
    }

    
    command(trigger, callback) {
        this.client.on("messageCreate", (message) => {
            if (message.content === trigger) callback(message);
        });
    }

    setPrefix(prefix) {
        this.prefix = prefix;
    }

    commandWithPrefix(cmd, callback) {
        this.client.on("messageCreate", (message) => {
            if (!this.prefix || message.author.bot) return;
            if (message.content.startsWith(this.prefix + cmd)) {
                callback(message);
            }
        });
    }

    
 

    
    reply(trigger, replyText) {
        return new Promise((resolve) => {
            this.client.on("messageCreate", async (message) => {
                if (message.content === trigger) {
                    const sent = await message.reply(replyText);
                    resolve({ botMessage: sent, userMessage: message });
                }
            });
        });
    }
async loadInvites() {
    for (const [guildId, guild] of this.client.guilds.cache) {
        try {
            const invites = await guild.invites.fetch();
            this.invites.set(guildId, new Map(invites.map(inv => [inv.code, inv.uses || 0])));
        } catch (err) {
            console.error(`خطأ في تحميل الدعوات للسيرفر ${guild.name}:`, err);
            this.invites.set(guildId, new Map());
        }
    }
}


async inviteBy(member) {
    const guild = member.guild;

    
    if (!this.invites.has(guild.id)) await this.loadInvites();

    const oldInvites = this.invites.get(guild.id) || new Map();

    
    await new Promise(res => setTimeout(res, 800));
    const newInvites = await guild.invites.fetch().catch(() => new Map());

    
    let usedInvite = null;
    newInvites.forEach(inv => {
        const oldUses = oldInvites.get(inv.code) || 0;
        if (inv.uses > oldUses) usedInvite = inv;
    });

    
    this.invites.set(guild.id, new Map(newInvites.map(inv => [inv.code, inv.uses])));

    if (usedInvite && usedInvite.inviter) {
        return {
            name: usedInvite.inviter.username,
            id: usedInvite.inviter.id,
            tag: usedInvite.inviter.tag,
            count: usedInvite.uses
        };
    } else if (guild.vanityURLCode) {
        return { name: "Vanity URL", id: null, tag: null, count: null };
    }

    return null; 
}

    
    
    delete(target = "bot", messageData, timeout = 0) {
        return new Promise((resolve, reject) => {
            let messageToDelete;

            if (target === "bot") {
                messageToDelete = messageData?.botMessage || messageData;
            } else if (target === "user") {
                messageToDelete = messageData?.userMessage || messageData;
            }

            if (messageToDelete && messageToDelete.delete) {
                setTimeout(async () => {
                    try {
                        await messageToDelete.delete();
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                }, timeout);
            } else {
                reject("no message found or cannot delete");
            }
        });
    }

    deleteChannel(channelId, timeout = 0) {
        return new Promise((resolve, reject) => {
            const channel = this.client.channels.cache.get(channelId);
            if (!channel) return reject("channel not found");
            setTimeout(async () => {
                try {
                    await channel.delete();
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }, timeout);
        });
    }

    editChannelPermissions(channelId, permissions, timeout = 0) {
        return new Promise((resolve, reject) => {
            const channel = this.client.channels.cache.get(channelId);
            if (!channel) return reject("channel not found");
            setTimeout(async () => {
                try {
                    await channel.edit({ permissionOverwrites: permissions });
                    resolve();
                } catch (err) {
                    reject(err);
                }
            }, timeout);
        });
    }

    edit(messageData, newText, timeout = 0) {
        return new Promise((resolve, reject) => {
            let messageToEdit = messageData?.botMessage || messageData;

            if (messageToEdit && messageToEdit.edit) {
                setTimeout(async () => {
                    try {
                        await messageToEdit.edit(newText);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                }, timeout);
            } else {
                reject("no message found or cannot edit");
            }
        });
    }

    
    async bulkDelete(channelId, amount = 10) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) throw new Error("Channel not found");
            
            const messages = await channel.messages.fetch({ limit: amount });
            await channel.bulkDelete(messages);
            return `Deleted ${messages.size} messages`;
        } catch (err) {
            throw err;
        }
    }

    
    send(channelId, text) {
        return new Promise(async (resolve, reject) => {
            try {
                const channel = await this.client.channels.fetch(channelId);
                if (!channel) return reject("channel not found");
                const sent = await channel.send(text);
                resolve(sent);
            } catch (err) {
                reject(err);
            }
        });
    }

    sendEmbed(channelId, embedOptions) {
        return new Promise(async (resolve, reject) => {
            try {
                const channel = await this.client.channels.fetch(channelId);
                if (!channel) return reject("channel not found");
                const embed = new EmbedBuilder(embedOptions);
                const sent = await channel.send({ embeds: [embed] });
                resolve(sent);
            } catch (err) {
                reject(err);
            }
        });
    }

    createButton(label, customId, style = "Primary", emoji = null, disabled = false) {
        const button = new ButtonBuilder()
            .setLabel(label)
            .setCustomId(customId)
            .setStyle(ButtonStyle[style])
            .setDisabled(disabled);
        
        if (emoji) button.setEmoji(emoji);
        return button;
    }
    
    
    createLinkButton(label, url, emoji = null, disabled = false) {
        const button = new ButtonBuilder()
            .setLabel(label)
            .setURL(url)
            .setStyle(ButtonStyle.Link)
            .setDisabled(disabled);
        
        if (emoji) button.setEmoji(emoji);
        return button;
    }
    
    
    createButtonRow(buttons = []) {
        const row = new ActionRowBuilder();
        buttons.forEach(button => row.addComponents(button));
        return row;
    }
    
    
    async sendButton(channelId, text, buttons = [], embed = null) {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) throw new Error("Channel not found");
            
            const messageData = { content: text, components: buttons };
            if (embed) messageData.embeds = [embed];
            
            const sent = await channel.send(messageData);
            return sent;
        } catch (err) {
            throw err;
        }
    }
    
    
    async replyWithButtons(message, text, buttons = [], embed = null) {
        try {
            const messageData = { content: text, components: buttons };
            if (embed) messageData.embeds = [embed];
            
            const sent = await message.reply(messageData);
            return sent;
        } catch (err) {
            throw err;
        }
    } 

    createEmbed(embedOptions) {
        return embedOptions; 
    }
    
    
    async sendEmbedWithButtons(channelId, embedOptions, buttons = [], text = "") {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (!channel) throw new Error("Channel not found");
    
            const messageData = { content: text, embeds: [embedOptions] };
            if (buttons.length) messageData.components = buttons;
    
            const sent = await channel.send(messageData);
            return sent; 
        } catch (err) {
            throw err;
        }
    }

    
    onButtonClick(customId, callback) {
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId !== customId) return;
            
            callback(interaction);
        });
    }
    
    onAnyButtonClick(callback) {
        this.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            callback(interaction);
        });
    }

CreateSlashCommand(commandName, commandDescription, commandOptions = []) {
    const command = new SlashCommandBuilder()
        .setName(commandName)
        .setDescription(commandDescription);

    
    commandOptions.forEach(option => {
        switch(option.type) {
            case 'string':
                command.addStringOption(opt => 
                    opt.setName(option.name)
                       .setDescription(option.description)
                       .setRequired(option.required || false)
                );
                break;
            case 'user':
                command.addUserOption(opt => 
                    opt.setName(option.name)
                       .setDescription(option.description)
                       .setRequired(option.required || false)
                );
                break;
            case 'channel':
                command.addChannelOption(opt => 
                    opt.setName(option.name)
                       .setDescription(option.description)
                       .setRequired(option.required || false)
                );
                break;
        }
    });

    this.slashCommands.push(command.toJSON());
    return command;
}


onSlashCommand(commandName, callback) {
    this.slashCommandHandlers.set(commandName, callback);
}



async registerSlashCommands(clientId, guildId = null) {
    const rest = new REST({ version: '10' }).setToken(this.token);

    try {
        console.log('Started refreshing slash commands...');
        
        if (guildId) {
            
            await rest.put(
                Routes.applicationGuildCommands(clientId, guildId),
                { body: this.slashCommands }
            );
        } else {
            
            await rest.put(
                Routes.applicationCommands(clientId),
                { body: this.slashCommands }
            );
        }

        console.log('Successfully reloaded slash commands.');
    } catch (error) {
        console.error(error);
    }
}


    

    
    async createChannel(guildId, name, type = 0, options = {}) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const channel = await guild.channels.create({
                name,
                type,
                ...options
            });
            return channel;
        } catch (err) {
            throw err;
        }
    }

    
    react(messageData, emoji) {
        let messageToReact = messageData?.botMessage || messageData;
        if (!messageToReact) return Promise.reject("No message to react to");
        return messageToReact.react(emoji);
    }

    
    async multiReact(messageData, emojis = []) {
        let messageToReact = messageData?.botMessage || messageData;
        if (!messageToReact) return Promise.reject("No message to react to");
        
        for (const emoji of emojis) {
            await messageToReact.react(emoji);
        }
    }

    
    getUser(id) {
        return this.client.users.fetch(id);
    }

    async getMember(guildId, userId) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            return await guild.members.fetch(userId);
        } catch (err) {
            throw err;
        }
    }

    
    async kickUser(msg, userOrId, reason = "No reason") {
        try {
            let userId;
            if (userOrId.id) userId = userOrId.id;
            else userId = userOrId;

            const member = await msg.guild.members.fetch(userId).catch(() => null);
            if (!member) return msg.reply("User not found in this server ❌");

            await member.kick(reason);
            return msg.reply(`${member.user.tag} تم طرده من السيرفر ✅`);
        } catch (err) {
            console.error(err);
            return msg.reply("حدث خطأ أثناء محاولة الطرد ❌");
        }
    }

    async banUser(msg, userOrId, reason = "No reason") {
        try {
            let userId;
            if (userOrId.id) userId = userOrId.id;
            else userId = userOrId;

            const member = await msg.guild.members.fetch(userId).catch(() => null);

            if (member) {
                await member.ban({ reason });
                return msg.reply(`${member.user.tag} تم حظره من السيرفر ✅`);
            } else {
                await msg.guild.bans.create(userId, { reason });
                return msg.reply(`User with ID ${userId} تم حظره من السيرفر ✅`);
            }
        } catch (err) {
            console.error(err);
            return msg.reply("حدث خطأ أثناء محاولة الحظر ❌");
        }
    }

    
    async unbanUser(guildId, userId, reason = "No reason") {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            await guild.bans.remove(userId, reason);
            return `User ${userId} has been unbanned`;
        } catch (err) {
            throw err;
        }
    }

    
    async timeoutUser(msg, userOrId, duration, reason = "No reason") {
        try {
            let userId;
            if (userOrId.id) userId = userOrId.id;
            else userId = userOrId;

            const member = await msg.guild.members.fetch(userId);
            await member.timeout(duration, reason);
            return msg.reply(`${member.user.tag} تم إعطاؤه تايم أوت ⏱️`);
        } catch (err) {
            return msg.reply("حدث خطأ أثناء إعطاء التايم أوت ❌");
        }
    }

    
    async addRole(guildId, userId, roleId) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const member = await guild.members.fetch(userId);
            const role = await guild.roles.fetch(roleId);
            await member.roles.add(role);
            return `Role added to ${member.user.tag}`;
        } catch (err) {
            throw err;
        }
    }

    async removeRole(guildId, userId, roleId) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const member = await guild.members.fetch(userId);
            const role = await guild.roles.fetch(roleId);
            await member.roles.remove(role);
            return `Role removed from ${member.user.tag}`;
        } catch (err) {
            throw err;
        }
    }

    
    async createRole(guildId, name, options = {}) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            const role = await guild.roles.create({
                name,
                ...options
            });
            return role;
        } catch (err) {
            throw err;
        }
    }

    
    requiredPermission(msg, perm) {
        if (msg.member.permissions.has(perm)) return true;
        return false;
    }

    hasRole(member, roleId) {
        return member.roles.cache.has(roleId);
    }

    
    async mentionUser(msg) {
        let user = msg.mentions.users.first();
        if (user) return user;

        const args = msg.content.split(" ");
        const id = args[1];
        if (!id) return null;

        try {
            user = await this.getUser(id);
            return user;
        } catch {
            return null;
        }
    }

    
    async getGuildInfo(guildId) {
        try {
            const guild = await this.client.guilds.fetch(guildId);
            return {
                name: guild.name,
                memberCount: guild.memberCount,
                ownerId: guild.ownerId,
                createdAt: guild.createdAt,
                channels: guild.channels.cache.size,
                roles: guild.roles.cache.size
            };
        } catch (err) {
            throw err;
        }
    }


async inviteBy() {
    
}

    
    async connectToVoice(channelId) {
        try {
            const { joinVoiceChannel } = require('@discordjs/voice');
            const channel = await this.client.channels.fetch(channelId);
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            return connection;
        } catch (err) {
            throw err;
        }
    }

    
    setStatus(status, activity = null, type = 0) {
        this.client.user.setPresence({
            status: status, 
            activities: activity ? [{
                name: activity,
                type: type 
            }] : []
        });
    }

    
    log(message, type = "INFO") {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }


    

   

}

module.exports = EzDiscord;
