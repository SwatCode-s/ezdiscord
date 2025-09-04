# EzDiscord

[![npm version](https://img.shields.io/npm/v/ezdiscord)](https://www.npmjs.com/package/ezdiscord)  
[![License](https://img.shields.io/npm/l/ezdiscord)](https://www.npmjs.com/package/ezdiscord)

**EzDiscord** is a powerful and easy-to-use Discord.js wrapper that simplifies creating bots with commands, moderation tools, welcome messages, invites tracking, voice channels, and more.  

It’s perfect for developers who want a **clean and modular API** for building Discord bots without repetitive boilerplate code.

---

## 🚀 Features

- Easy command management:
  - `bot.command()` for basic commands
  - `bot.commandWithPrefix()` for prefix-based commands
- User & member utilities
  - Fetch users or members easily
  - Mention detection
- Moderation tools
  - Ban, kick, timeout, role management
- Invites tracking
  - Track who invited new members
  - Support for normal invites and Vanity URLs
- Channel & message management
  - Send/edit/delete messages
  - Bulk delete
  - Embed support
- Voice channels
  - Join voice channels using Discord.js Voice
- Status & activity
- Error handling built-in

- Buttons
  - Send buttons with embeds
  - Handle button clicks

---

## ⚡ Installation

```bash
npm install ezdiscord
```
--- 


## 📝 Usage

```javascript
const EzDiscord = require("ezdiscord")

const bot = new EzDiscord("BOT TOKEN");
bot.setPrefix("!");
bot.handleErrors();
bot.login();

const invites = new Map();


bot.ready(async () => {
    console.log(`${bot.client.user.tag} is online!`);
    
    
    for (const guild of bot.client.guilds.cache.values()) {
        try {
            const guildInvites = await guild.invites.fetch();
            invites.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
        } catch (error) {
            console.error(`Error loading invites for guild ${guild.name}:`, error);
        }
    }

});



bot.on('inviteCreate', async (invite) => {
    const guildInvites = invites.get(invite.guild.id) || new Map();
    guildInvites.set(invite.code, invite.uses || 0);
    invites.set(invite.guild.id, guildInvites);
});


bot.on('inviteDelete', async (invite) => {
    const guildInvites = invites.get(invite.guild.id) || new Map();
    guildInvites.delete(invite.code);
    invites.set(invite.guild.id, guildInvites);
});



bot.command("ping", (msg) => msg.reply("pong!"));


bot.reply("test", "This is a test!").then((data) => {
    bot.delete("bot", data, 5000);    
    bot.delete("user", data, 2000);   
    bot.edit(data, "Message edited!", 3000); 
});



bot.commandWithPrefix("clear", async (msg) => {
    if (!bot.requiredPermission(msg, "ManageMessages"))
        return msg.reply("You don't have permission! ❌");
        
    const amount = parseInt(msg.content.split(" ")[1]) || 10;
    if (amount > 100) return msg.reply("You can't delete more than 100 messages!");
    
    try {
        await bot.bulkDelete(msg.channel.id, amount);
        const reply = await msg.reply(`${amount} messages deleted ✅`);
        
        setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (err) {
        msg.reply("Failed to delete messages! Make sure the messages are older than 14 days ❌");
    }
});




bot.commandWithPrefix("info", (msg) => {
    bot.sendEmbed(msg.channel.id, {
        title: "Server info",
        description: "This server is great!",
        color: 0x00ff00,
        thumbnail: { url: msg.guild.iconURL() },
        fields: [
            { name: "Members", value: msg.guild.memberCount, inline: true },
            { name: "Channels", value: msg.guild.channels.cache.size, inline: true }
        ],
        footer: { text: "Created with EzDiscord" },
        timestamp: new Date()
    });

});

bot.commandWithPrefix("profile", async (msg) => {
    const user = await bot.mentionUser(msg) || msg.author;
    const member = await bot.getMember(msg.guild.id, user.id);
    
    bot.sendEmbed(msg.channel.id, {
        title: `Profile of ${user.username}`,
        color: 0x00ff00,
        thumbnail: { url: user.displayAvatarURL({dynamic: true}) },
        fields: [
            { name: "Name", value: user.tag, inline: true },
            { name: "ID", value: user.id, inline: true },
            { name: "Joined Discord", value: user.createdAt.toDateString(), inline: true },
            { name: "Joined Server", value: member.joinedAt.toDateString(), inline: true },
            { name: "Roles", value: member.roles.cache.map(r => r.name).join(", ") || "No roles" }
        ]
    });
});


bot.commandWithPrefix("kick", async (msg) => {
    if (!bot.requiredPermission(msg, "KickMembers"))
        return msg.reply("You don't have permission! ❌");
    
    const user = await bot.mentionUser(msg);
    if (!user) return msg.reply("Mention a user! ❌");
    
    const reason = msg.content.split(" ").slice(2).join(" ") || "No reason";
    await bot.kickUser(msg, user, reason);
});


bot.commandWithPrefix("ban", async (msg) => {
    if (!bot.requiredPermission(msg, "BanMembers"))
        return msg.reply("You don't have permission! ❌");
        
    const user = await bot.mentionUser(msg);
    if (!user) return msg.reply("Mention a user! ❌");
    const reason = msg.content.split(" ").slice(2).join(" ") || "No reason";
    await bot.banUser(msg, user, reason);
});


bot.commandWithPrefix("unban", async (msg) => {
    if (!bot.requiredPermission(msg, "BanMembers"))
        return msg.reply("You don't have permission! ❌");
    const userId = msg.content.split(" ")[1];
    if (!userId) return msg.reply("Put the ID! ❌");
    
    try {
        await bot.unbanUser(msg.guild.id, userId, "Unbanned by admin");
        msg.reply("Unbanned ✅");
    } catch (err) {
        msg.reply("Failed to unban ❌");
    }
});


bot.commandWithPrefix("timeout", async (msg) => {
    if (!bot.requiredPermission(msg, "TimeoutMembers"))
        return msg.reply("You don't have permission! ❌");
        
    const user = await bot.mentionUser(msg);
    if (!user) return msg.reply("Mention a user! ❌");
    
    const minutes = parseInt(msg.content.split(" ")[2]);
    if (!minutes || minutes < 1) return msg.reply("Put the minutes! ❌");
    
    const duration = minutes * 60 * 1000; 
    await bot.timeoutUser(msg, user, duration, "Timeout by admin");
});




bot.commandWithPrefix("addrole", async (msg) => {
    const user = await bot.mentionUser(msg);
    const roleName = msg.content.split(" ").slice(2).join(" ");
    const role = msg.guild.roles.cache.find(r => r.name === roleName);
    
    if (!role) return msg.reply("Role not found! ❌");
    
    try {
        await bot.addRole(msg.guild.id, user.id, role.id);
        msg.reply(`Given role ${role.name} to ${user.tag} ✅`);
    } catch (err) {
        msg.reply("Failed to give role ❌");
    }
});


bot.commandWithPrefix("createrole", async (msg) => {
    const roleName = msg.content.split(" ").slice(1).join(" ");
    
    try {
        const role = await bot.createRole(msg.guild.id, roleName, {
            color: "Random",
            permissions: ["SendMessages", "ReadMessageHistory"]
        });
        msg.reply(`Created role ${role.name} ✅`);
    } catch (err) {
        msg.reply("Failed to create role ❌");
    }
});






bot.commandWithPrefix("createtext", async (msg) => {
    const channelName = msg.content.split(" ").slice(1).join("-");
    
    try {
        const channel = await bot.createChannel(msg.guild.id, channelName, 0, {
            topic: "Created with EzDiscord"
        });
        msg.reply(`Created channel ${channel} ✅`);
    } catch (err) {
        msg.reply("Failed to create channel ❌");
    }
});


bot.commandWithPrefix("createvoice", async (msg) => {
    const channelName = msg.content.split(" ").slice(1).join(" ");
    
    try {
        const channel = await bot.createChannel(msg.guild.id, channelName, 2, {
            userLimit: 10
        });
        msg.reply(`Created voice channel ${channel.name} ✅`);
    } catch (err) {
        msg.reply("Failed to create voice channel ❌");
    }
});


bot.commandWithPrefix("join", async (msg) => {
    if (!msg.member.voice.channel) 
        return msg.reply("Join a voice channel first! ❌");
    
    try {
        const connection = await bot.connectToVoice(msg.member.voice.channel.id);
        msg.reply("Joined the voice channel! 🎵");
    } catch (err) {
        msg.reply("Failed to join the voice channel ❌");
    }
});






bot.commandWithPrefix("serverinfo", async (msg) => {
    const guildInfo = await bot.getGuildInfo(msg.guild.id);
    
    bot.sendEmbed(msg.channel.id, {
        title: `Server info ${guildInfo.name}`,
        fields: [
            { name: "Members", value: guildInfo.memberCount, inline: true },
            { name: "Channels", value: guildInfo.channels, inline: true },
            { name: "Roles", value: guildInfo.roles, inline: true },
            { name: "Creation Date", value: guildInfo.createdAt.toDateString() },
            { name: "Owner", value: `<@${guildInfo.ownerId}>` }
        ],
        color: 0x7289da
    });
});


bot.commandWithPrefix("botstats", (msg) => {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    bot.sendEmbed(msg.channel.id, {
        title: "Bot stats",
        fields: [
            { name: "Servers", value: bot.client.guilds.cache.size, inline: true },
            { name: "Users", value: bot.client.users.cache.size, inline: true },
            { name: "Uptime", value: `${hours}h ${minutes}m`, inline: true }
        ]
    });
});
bot.commandWithPrefix("roll", (msg) => {
    const max = parseInt(msg.content.split(" ")[1]) || 6;
    const result = Math.floor(Math.random() * max) + 1;
    msg.reply(`🎲 Result: ${result}`);
});


bot.commandWithPrefix("choose", (msg) => {
    const options = msg.content.split(" ").slice(1);
    if (options.length < 2) return msg.reply("Put at least two options!");
    
    const choice = options[Math.floor(Math.random() * options.length)];
    msg.reply(`🤔 Choice: **${choice}**`);
});


bot.commandWithPrefix("rps", (msg) => {
    const choices = ["🗿", "📄", "✂️"];
    const userChoice = msg.content.split(" ")[1];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];
    
    msg.reply(`You: ${userChoice} | Bot: ${botChoice}`);
});


bot.on('guildMemberAdd', async (member) => {
    try {
        const guild = member.guild;
        
        
        const newInvites = await guild.invites.fetch();
        const oldInvites = invites.get(guild.id) || new Map();
        
        
        let usedInvite = null;
        let inviter = null;
        
        for (const [code, invite] of newInvites) {
            const oldUses = oldInvites.get(code) || 0;
            if (invite.uses > oldUses) {
                usedInvite = invite;
                inviter = invite.inviter;
                break;
            }
        }
        
        
        invites.set(guild.id, new Map(newInvites.map(invite => [invite.code, invite.uses])));
        
        
        const welcomeChannel = guild.channels.cache.find(
            channel => channel.name === 'invite' || channel.name === 'welcome'
        );
        
        if (!welcomeChannel) {
            console.log('No welcome channel found');
            return;
        }
        

        bot.send(welcomeChannel.id, `**${member.user.tag}** joined the server! By ${inviter.tag} and ${usedInvite.uses} invites used`);
  
        
    } catch (error) {
        console.error('Error in welcome system:', error);
    }
});


bot.on("guildMemberRemove", (member) => {
    const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === "invite");
    if (!welcomeChannel) return;
    
    bot.send(welcomeChannel.id, `**${member.user.tag}** left the server!`);
    
});




```


## 🛠 Commands Example

Simple command:
```javascript
bot.command("ping", (msg) => msg.reply("pong!"));
```

Prefix command:
```javascript
bot.commandWithPrefix("ping", (msg) => msg.reply("pong!"));
```

Edit command:
```javascript
bot.reply("test", "This is a test!").then((data) => {
    bot.edit(data, "Message edited!", 3000); 
});
```

Delete command:
```javascript
bot.reply("test", "This is a test!").then((data) => {
    bot.delete("bot", data, 3000) // for bot msg delete
    bot.delete("user", data, 3000) // for user msg delete
});
```


Prefix command with user profile embed:

```javascript
bot.commandWithPrefix("profile", async (msg) => {
    const user = await bot.mentionUser(msg) || msg.author;
    const member = await bot.getMember(msg.guild.id, user.id);
    
    bot.sendEmbed(msg.channel.id, {
        title: `Profile of ${user.username}`,
        color: 0x00ff00,
        thumbnail: { url: user.displayAvatarURL({dynamic: true}) },
        fields: [
            { name: "Name", value: user.tag, inline: true },
            { name: "ID", value: user.id, inline: true },
            { name: "Joined at", value: member.joinedAt.toDateString(), inline: true },
            { name: "Roles", value: member.roles.cache.map(r => r.name).join(", ") || "No roles" }
        ]
    });
});
```

Bulk delete command:
```javascript
bot.commandWithPrefix("clear", async (msg) => {
    if (!bot.requiredPermission(msg, "ManageMessages"))
        return msg.reply("You don't have permission! ❌");
        
    const amount = parseInt(msg.content.split(" ")[1]) || 10;
    if (amount > 100) return msg.reply("You can't delete more than 100 messages!");
    
    try {
        await bot.bulkDelete(msg.channel.id, amount);
        const reply = await msg.reply(`Deleted ${amount} messages ✅`);
        
        setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (err) {
        msg.reply(err);
    }
});
```

🛡 Moderation Example:
```javascript
bot.commandWithPrefix("kick", async (msg) => {
    if (!bot.requiredPermission(msg, "KickMembers"))
        return msg.reply("You don't have permission! ❌");
        
    const user = await bot.mentionUser(msg) || msg.author;
    const member = await bot.getMember(msg.guild.id, user.id);
    
    try {
        await member.kick();
        const reply = await msg.reply(`Kicked ${user.tag} ✅`);
        
        setTimeout(() => reply.delete().catch(() => {}), 3000);
    } catch (err) {
        msg.reply(err);
    }
});
```


Button Example:
```javascript

bot.command("ping", async (msg) => {
    const button = bot.createButton("Pong! 🏓", "ping_btn", "Primary", "🏓");
    const row = bot.createButtonRow([button]);
    await bot.replyWithButtons(msg, "Click the button:", [row]);
});

bot.onButtonClick("ping_btn", async (interaction) => {
    await interaction.reply({ content: "Pong! 🏓", ephemeral: true });
});


```

Multiple buttons With Embed example:
```javascript

bot.commandWithPrefix("support", async (msg) => {
    
    const embed = bot.createEmbed({
        title: "🎫 System Support",
        description: "How can we help you?",
        color: 0x00ff00
    });

    
    const techButton = bot.createButton("💻 Technical", "support_tech", "Primary", "💻");
    const reportButton = bot.createButton("⚠️ Report", "support_report", "Danger", "⚠️");
    const suggestionButton = bot.createButton("💡 Suggestion", "support_suggestion", "Success", "💡");
    const otherButton = bot.createButton("❓ Other", "support_other", "Secondary", "❓");

    const row = bot.createButtonRow([techButton, reportButton, suggestionButton, otherButton]);

    
    await bot.sendEmbedWithButtons(msg.channel.id, embed, [row], "Embed with buttons");
});

bot.onButtonClick("support_tech", async (interaction) => {
    await interaction.reply({ content: "Tech support", ephemeral: true });
});

bot.onButtonClick("support_report", async (interaction) => {
    await interaction.reply({ content: "Report support", ephemeral: true });
});

bot.onButtonClick("support_suggestion", async (interaction) => {
    await interaction.reply({ content: "Suggestion support", ephemeral: true });
});

bot.onButtonClick("support_other", async (interaction) => {
    await interaction.reply({ content: "Other support", ephemeral: true });
});




```


## Big Example

```javascript

const EzDiscord = require("ezdiscord")

const bot = new EzDiscord("BOT TOKEN");
bot.setPrefix("!");
bot.handleErrors();
bot.login();



bot.ready(async () => {
    console.log(`${bot.client.user.tag} is online!`)
    bot.setPresence({
        status: "online",
        activity: {
            name: "with ezdiscord",
            type: "PLAYING"
        }
    })

});


bot.commandWithPrefix("ticket", async (msg) => {
    
    const embed = bot.createEmbed({
        title: "🎫 Ticket System",
        description: "Please click the button to open a ticket",
        color: 0x00ff00,
        thumbnail: { url: msg.guild.iconURL({ dynamic: true, size: 1024 }) }
    });

    
    const techButton = bot.createButton("Open ticket","ticket", "Primary", "🎫");
   
    const row = bot.createButtonRow([techButton]);

    
    await bot.sendEmbedWithButtons(msg.channel.id, embed, [row], "");
});


bot.onButtonClick("ticket", async (interaction) => {
    let supportrole = await interaction.guild.roles.fetch("1403378649243062452");
    const channel = await bot.createChannel(
        interaction.guild.id,
        `ticket-${interaction.user.username}`,

        0, 
        {
            parent: "1403448330427826176",
            permissionOverwrites: [
                {
                    id: interaction.guild.roles.everyone,
                    deny: ["ViewChannel"],   
                },
                {
                    id: interaction.user.id,
                    allow: ["ViewChannel", "SendMessages"], 
                },
                {
                    id: supportrole.id,
                    allow: ["ViewChannel", "SendMessages"], 
                },

            ],
            topic: "Ticket System",

        }
    );

    await interaction.reply({ content:`Ticket created <#${channel.id}>`, ephemeral: true })



    const embed = bot.createEmbed({
        title: "🎫 New ticket",
        description: "Please wait for support",
        color: 0x00ff00,
        thumbnail: { url: interaction.guild.iconURL({ dynamic: true, size: 1024 }) }
    });

    const closeButton = bot.createButton("Close", "close", "Primary", "🔒");
    const deleteButton = bot.createButton("Delete", "Delete", "Danger", "❌");   

    const row = bot.createButtonRow([closeButton, deleteButton]);


    await bot.sendEmbedWithButtons(channel.id, embed, [row], `<@${interaction.user.id}>`);
});
bot.onButtonClick("close", async (interaction) => {
    await bot.editChannelPermissions(interaction.channel.id, [
        {
            id: interaction.guild.roles.everyone, 
            deny: ["ViewChannel"], 


        },
        {
            id: "1403378649243062452",
            allow: ["ViewChannel", "SendMessages"], 
        }
    ]);

    await interaction.reply({ content: "Ticket closed 🚫", ephemeral: true });
});

bot.onButtonClick("Delete", async (interaction) => {
    await bot.deleteChannel(interaction.channel.id);
});


```

## 📦 Utilities

- Mention user:
```javascript
bot.mentionUser(msg); // detect mentions or IDs
```

- Get member:
```javascript
bot.getMember(guildId, userId); // fetch guild member
```

- Send message:
```javascript
bot.send(channelId, text); // send simple message
```

- Send embed:
```javascript
bot.sendEmbed(channelId, embedOptions); // send embed
```

- Bulk delete:
```javascript
bot.bulkDelete(channelId, amount); // bulk delete messages
```

- Create channel:
```javascript
bot.createChannel(guildId, name, type, parent, permissionOverwrites); // create channel
```

- Edit channel permissions:
```javascript
bot.editChannelPermissions(channelId, permissionOverwrites); // edit channel permissions
```

- Delete channel:
```javascript
bot.deleteChannel(channelId); // delete channel
```

- Set presence:
```javascript
bot.setPresence({
    status: "online",
    activity: {
        name: "with ezdiscord",
        type: "PLAYING"
    }
});
```

- createEmbed:
```javascript
bot.createEmbed({
    title: "Title",
    description: "Description",
    color: 0x00ff00,
    thumbnail: { url: "https://example.com/image.png" }
});// for buttons
```

- createButton:
```javascript
bot.createButton(label, customId, style, emoji); // create button
```

- createButtonRow:
```javascript
bot.createButtonRow([button1, button2]); // create button row
```

- sendEmbedWithButtons:
```javascript
bot.sendEmbedWithButtons(channelId, embed, buttonRows, text); // send embed with buttons
```

- replyWithButtons:
```javascript
bot.replyWithButtons(msg, text, buttonRows); // reply with buttons
```

- onButtonClick:
```javascript
bot.onButtonClick(customId, callback); // handle button clicks
```




- requiredPermission:
```javascript
bot.requiredPermission(msg, permission); // check if user has permission
```



## 💡 Notes

Make sure your bot has the proper permissions for moderation, invites tracking, and message management.

Supports Vanity URLs for invite tracking.

Fully compatible with Discord.js v14.

contact me: mhmdpluxury