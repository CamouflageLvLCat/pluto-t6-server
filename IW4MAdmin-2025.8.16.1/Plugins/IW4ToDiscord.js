/*
Copyright (c) 2021 Ouchekkir Abdelmouaine
(licencia original preservada)
*/

const init = (registerNotify, serviceResolver, config, scriptHelper) => {
    registerNotify('IManagementEventSubscriptions.ClientPenaltyAdministered', (clientPenaltyEvent) =>
        plugin.onClientPenalty(clientPenaltyEvent)
    );
    registerNotify('IManagementEventSubscriptions.ClientPenaltyRevoked', (clientPenaltyEvent) =>
        plugin.onClientPenalty(clientPenaltyEvent)
    );
    registerNotify('IManagementEventSubscriptions.ClientStateAuthorized', (clientAuthorizedEvent) =>
        plugin.onClientAuthorized(clientAuthorizedEvent)
    );
    registerNotify('IManagementEventSubscriptions.ClientStateDisposed', (clientDisposedEvent) =>
        plugin.onClientDisposed(clientDisposedEvent)
    );
    registerNotify('IGameServerEventSubscriptions.ConnectionInterrupted', (connectionInterruptedEvent) =>
        plugin.onServerConnectionInterrupted(connectionInterruptedEvent)
    );
    registerNotify('IGameServerEventSubscriptions.ConnectionRestored', (connectionRestoredEvent) =>
        plugin.onServerConnectionRestored(connectionRestoredEvent)
    );
    registerNotify('IGameServerEventSubscriptions.MonitoringStarted', (serverMonitoredEvent) =>
        plugin.onServerMonitored(serverMonitoredEvent)
    );
    registerNotify('IGameEventSubscriptions.ClientMessaged', (clientMessagedEvent) =>
        plugin.onClientSayEvent(clientMessagedEvent)
    );

    plugin.onLoad(serviceResolver, config, scriptHelper);
    return plugin;
};

const plugin = {
    author: 'Zwambro, Amos, RaidMax',
    version: 2.2,
    name: 'IW4ToDiscord',

    manager: null,
    logger: null,
    configHandler: null,
    scriptHelper: null,
    baseURL: null, // nota: la propiedad original; el código usa this.baseUrl (se crea en onLoad)
    webhookConfig: {
        reports: null,
        bans: null,
        status: null,
        say: null,
        connections: null,
    },

    onLoad: function (serviceResolver, config, scriptHelper) {
        // guardo webfront url en this.baseUrl (es lo que usan las funciones)
        this.baseUrl = serviceResolver.resolveService('ApplicationConfiguration').webfrontUrl;
        this.manager = serviceResolver.resolveService('IManager');
        this.logger = serviceResolver.resolveService('ILogger', ["ScriptPluginV2"]);
        this.scriptHelper = scriptHelper;

        this.configHandler = config;
        this.configHandler.setName(this.name);

        // Inicializar webhooks (mantengo la lógica original)
        const webhookKeys = ["reports", "bans", "status", "say", "connections"];
        for (const key of webhookKeys) {
            this.webhookConfig[key] = this.configHandler.getValue(`${key.charAt(0).toUpperCase() + key.slice(1)}Webhook`, webhook => plugin.webhookConfig[key] = webhook);

            if (this.webhookConfig[key] === undefined) {
                this.configHandler.setValue(`${key.charAt(0).toUpperCase() + key.slice(1)}Webhook`, `your_${key}_webhook_url`);
            }
        }

        this.logger.logInformation('{Name} {Version} by {Author} loaded.', this.name, this.version, this.author);
    },

    onClientSayEvent: function (clientMessagedEvent) {
        const server = clientMessagedEvent.server;
        const client = clientMessagedEvent.client;

        // eliminar slash final del baseUrl si existe
        const base = this.baseUrl && this.baseUrl.endsWith("/")
            ? this.baseUrl.slice(0, -1)
            : this.baseUrl;

        // <<-- CAMBIO IMPORTANTE: ruta correcta al perfil en WebFront
        // antes: `${base}/client/${client.clientId}`
        const profileUrl = `${base}/Client/Profile/${client.clientId}`;

        const embed = {
            "author": {
                "name": client.cleanedName,      // nombre limpio
                "url": profileUrl,               // link oculto que ahora apunta a /Client/Profile/{id}
                "icon_url": this.getGameInfo(server).iconUrl,
            },
            "description": clientMessagedEvent.message?.stripColors(),
            "timestamp": new Date(),
            "color": 3564200,
            "footer": {
                "text": server.serverName.stripColors(),
            },
        };

        this.sendWebHook(embed, "say");
    },

    onClientAuthorized: function (clientAuthorizedEvent) {
        this.sendConnectionEmbed(clientAuthorizedEvent.client, "Connected", 96820);
    },

    onClientDisposed: function (clientDisposedEvent) {
        this.sendConnectionEmbed(clientDisposedEvent.client, "Disconnected", 10029348);
    },

    // Helper function to send connection/disconnection embeds
    sendConnectionEmbed: function (client, description, color) {
        const server = client.currentServer;
        const embed = {
            "author": {
                "name": this.getGameInfo(server).game,
                "icon_url": this.getGameInfo(server).iconUrl,
            },
            "title": client.cleanedName,
            "description": description,
            "timestamp": new Date(),
            "color": color,
            "footer": {
                "text": server.serverName.stripColors(),
            },
        };

        this.sendWebHook(embed, "connections");
    },

    onClientPenalty: function (clientPenaltyEvent) {
        const { client, penalty } = clientPenaltyEvent;
        const server = client.currentServer;
        const gameInfo = this.getGameInfo(server);
        const offense = penalty.offense?.stripColors();
        const adminNameAndUrl = this.getNameAndUrl(penalty.punisher);
        const clientNameAndUrl = this.getNameAndUrl(client);
        const duration = penalty.expires !== undefined
            ? this.timeFormat(penalty.expires - penalty.when)
            : null;

        switch (penalty.type) {
            case 'Report':
                this.onReportEvent(server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense);
                break;
            case 'Kick':
                this.onClientKickEvent(server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense);
                break;
            case 'TempBan':
                this.onClientTempBanEvent(server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense, duration);
                break;
            case 'Ban':
                this.onClientBanEvent(server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense);
                break;
            case 'Unban':
                this.onClientUnbanEvent(gameInfo, adminNameAndUrl, clientNameAndUrl, offense);
                break;
        }
    },

    onClientUnbanEvent: function (gameInfo, adminNameAndUrl, clientNameAndUrl, offense) {
        this.sendPenaltyEmbed(gameInfo, `${adminNameAndUrl} Unbanned ${clientNameAndUrl}`, 15132390,
            [{ name: "Reason", value: offense, inline: false }],
        );
    },

    onClientBanEvent: function (server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense) {
        this.sendPenaltyEmbed(gameInfo, `${adminNameAndUrl} Banned ${clientNameAndUrl}`, 15466496,
            [
                { name: "Reason", value: offense, inline: false },
                { name: "Server", value: server.serverName.stripColors(), inline: true },
                { name: "Duration", value: "Permanent", inline: true },
            ],
        );
    },

    onClientTempBanEvent: function (server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense, duration) {
        this.sendPenaltyEmbed(gameInfo, `${adminNameAndUrl} Temp Banned ${clientNameAndUrl}`, 15466496,
            [
                { name: "Reason", value: offense, inline: false },
                { name: "Server", value: server.serverName.stripColors(), inline: true },
                { name: "Duration", value: duration, inline: true },
            ],
        );
    },

    onClientKickEvent: function (server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense) {
        this.sendPenaltyEmbed(gameInfo, `${adminNameAndUrl} Kicked ${clientNameAndUrl}`, 15466496,
            [
                { name: "Reason", value: offense, inline: false },
                { name: "Server", value: server.serverName.stripColors(), inline: true },
            ],
        );
    },

    // Helper function to send penalty embeds
    sendPenaltyEmbed: function (gameInfo, description, color, fields) {
        const embed = {
            "author": {
                "name": gameInfo.game,
                "icon_url": gameInfo.iconUrl,
            },
            "description": description,
            "timestamp": new Date(),
            "color": color,
            "fields": fields,
        };

        this.sendWebHook(embed, "bans");
    },

    onReportEvent: function (server, gameInfo, adminNameAndUrl, clientNameAndUrl, offense) {
        const admins = Array.from(server.getClientsAsList())
            .filter(player => player.level !== "User" && player.level !== "Trusted" && player.level !== "Flagged" && !player.masked)
            .map(player => player.cleanedName)
            .join(", ");

        const embed = {
            "author": {
                "name": gameInfo.game,
                "icon_url": gameInfo.iconUrl,
            },
            "description": `${adminNameAndUrl} Reported ${clientNameAndUrl}`,
            "timestamp": new Date(),
            "color": gameInfo.color,
            "footer": {
                "text": `Online Admins: ${admins || "No admins online"}`,
            },
            "thumbnail": {
                "url": this.getMapThumb(server),
            },
            "fields": [
                { name: "Server", value: server.serverName.stripColors(), inline: false },
                { name: "Reason", value: offense, inline: false },
            ],
        };

        this.sendWebHook(embed, "reports");
    },

    onServerMonitored: function (serverMonitoredEvent) {
        this.sendServerStatusEmbed(serverMonitoredEvent.server, "started being monitored", 3394699);
    },

    onServerConnectionInterrupted: function (connectionInterruptedEvent) {
        this.sendServerStatusEmbed(connectionInterruptedEvent.server, "Lost connection to", 15073280);
    },

    onServerConnectionRestored: function (connectionRestoredEvent) {
        this.sendServerStatusEmbed(connectionRestoredEvent.server, "Restored connection to", 3394611);
    },

    // Helper function to send server status embeds
    sendServerStatusEmbed: function (server, description, color) {
        const embed = {
            "title": "Servers Status",
            "description": `** ${server.serverName.stripColors()} ${description} **`,
            "timestamp": new Date(),
            "color": color,
            "author": {
                "name": this.getGameInfo(server).game,
                "icon_url": this.getGameInfo(server).iconUrl,
            },
        };

        this.sendWebHook(embed, "status");
    },

    sendWebHook: function (embed, webhookType) {
        const webhookUrl = this.webhookConfig[webhookType];
        if (!webhookUrl) return;

        const params = { "embeds": [embed] };
        const pluginScript = importNamespace('IW4MAdmin.Application.Plugin.Script');
        const request = new pluginScript.ScriptPluginWebRequest(
            webhookUrl,
            JSON.stringify(params),
            'POST',
            'application/json',
            null
        );

        this.scriptHelper.requestUrl(request, (response) => {
            if (response.isError !== undefined) {
                this.logger.logWarning('There was a problem sending this webhook: {@Error}', response);
            }
        });
    },

    getNameAndUrl: function (client) {
        if (!client) return "`Unknown`";

        let name = client.cleanedName || (client.currentAlias && client.currentAlias.name && client.currentAlias.name.stripColors && client.currentAlias.name.stripColors()) || "Unknown";

        if (name === "IW4MAdmin") {
            return "`IW4MAdmin`";
        }

        // eliminar slash final del baseUrl si existe
        const base = this.baseUrl && this.baseUrl.endsWith("/")
            ? this.baseUrl.slice(0, -1)
            : this.baseUrl;

        // <<-- CAMBIO IMPORTANTE: usar la ruta que usa tu webfront
        return `[${name}](${base}/Client/Profile/${client.clientId})`;
    },

    timeFormat: function (time) {
        if (typeof time !== 'number') return 'N/A';

        const seconds = Math.floor(time % 60);
        const minutes = Math.floor((time / 60) % 60);
        const hours = Math.floor((time / 3600) % 24);
        const days = Math.floor(time / 86400);

        const timeComponents = [];
        if (days) timeComponents.push(`${days} day${days > 1 ? 's' : ''}`);
        if (hours) timeComponents.push(`${hours} hour${hours > 1 ? 's' : ''}`);
        if (minutes) timeComponents.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
        if (seconds) timeComponents.push(`${seconds} second${seconds > 1 ? 's' : ''}`);

        return timeComponents.join(' ') || 'N/A';
    },

    // Function to retrieve game information
    getGameInfo: function (server) {
        const game = GAME_INFO[server.rconParser.name];
        return game || {
            name: "Not Supported Game",
            iconUrl: "https://www.freeiconspng.com/uploads/csgo-icon-4.png",
            color: "0000000",
        };
    },

getMapThumb: function (server) {
    let gameCode = server.gameCode === "H1" ? "IW3" : server.gameCode;

    let mapName = null;

    try {
        // T6 FIX: el mapa no siempre es objeto
        if (server.currentMap) {
            if (typeof server.currentMap === "string") {
                mapName = server.currentMap;
            } else if (server.currentMap.name) {
                mapName = server.currentMap.name;
            }
        }

        // fallback extra (por si IW4MAdmin cambia estructura)
        if (!mapName && server.map) {
            mapName = server.map;
        }
    } catch {}

    if (!mapName) {
        return "https://cdn0.iconfinder.com/data/icons/flat-design-basic-set-1/24/error-exclamation-512.png";
    }

    return (MAP_URLS[gameCode] && MAP_URLS[gameCode][mapName])
        ? MAP_URLS[gameCode][mapName]
        : "https://cdn0.iconfinder.com/data/icons/flat-design-basic-set-1/24/error-exclamation-512.png";
},
};

const GAME_INFO = {
    "CoD4x Parser": {
        name: "CoD4x",
        iconUrl: "http://orig05.deviantart.net/8749/f/2008/055/0/c/call_of_duty_4__dock_icon_by_watts240.png",
        color: 6723840
    },
    "H1-Mod Parser": {
        name: "H1-Mod",
        iconUrl: "https://i.ibb.co/zS4pc0B/166013016241761317.png",
        color: 6723844
    },
    "IW4x Parser": {
        name: "IW4x",
        iconUrl: "https://i.gyazo.com/758b6933287392106bfdddc24b09d502.png",
        color: 11331072
    },
    "Tekno MW3 Parser": {
        name: "TeknoMW3",
        iconUrl: "https://orig00.deviantart.net/9af1/f/2011/310/2/1/modern_warfare_3_logo_by_wifsimster-d4f9ozd.png",
        color: 39219
    },
    "Plutonium IW5 Parser": {
        name: "PlutoIW5",
        iconUrl: "https://orig00.deviantart.net/9af1/f/2011/310/2/1/modern_warfare_3_logo_by_wifsimster-d4f9ozd.png",
        color: 39219
    },
    "IW6x Parser": {
        name: "IW6x",
        iconUrl: "https://i.gyazo.com/82b84341e141f6420db6c6ef1d9037bb.png",
        color: 39321
    },
    "Plutonium T4 MP Parser": {
        name: "PlutoT4",
        iconUrl: "https://i.gyazo.com/1e1987d84038aae38610cab9c999868d.png",
        color: 7829308
    },
    "Plutonium T4 CO-OP/Zombies Parser": {
        name: "PlutoT4 Singleplayer",
        iconUrl: "https://i.gyazo.com/1e1987d84038aae38610cab9c999868d.png",
        color: 7829308
    },
    "RektT5m Parser": {
        name: "RektT5M",
        iconUrl: "https://i.gyazo.com/a8a22764fafd4cc178329717b9bb35dd.png",
        color: 6064778
    },
    "Plutonium T5 Parser": {
        name: "PlutoT5",
        iconUrl: "https://i.gyazo.com/a8a22764fafd4cc178329717b9bb35dd.png",
        color: 6064778
    },
    "Plutonium T6 Parser": {
        name: "PlutoT6",
        iconUrl: "https://i.gyazo.com/5a445c5c733c698b32732550ec797e91.png",
        color: 15108608
    },
    "Black Ops 3 Parser": {
        name: "Call of Duty: Black Ops III",
        iconUrl: "https://i.gyazo.com/5691ca84d47e219cdec76901ff142159.png",
        color: 16737792
    },
    "BOIII Parser": {
        name: "BOIII",
        iconUrl: "https://i.imgur.com/nIi5QFP.jpg",
        color: 16737792
    },
    "S1x Parser": {
        name: "SHG1",
        iconUrl: "https://i.gyazo.com/d524bf93e1fc38fa46f8fe1ed5162493.png",
        color: 13421568
    },
    "CS:GO Parser": {
        name: "CSGO",
        iconUrl: "https://www.freeiconspng.com/uploads/csgo-icon-4.png",
        color: 1911881
    },
    "CS:GO (SourceMod) Parser": {
        name: "CSGO (SourceMod)",
        iconUrl: "https://www.freeiconspng.com/uploads/csgo-icon-4.png",
        color: 1911881
    }
};

// MAP_URLS truncated in this message for brevity - keep original full MAP_URLS from your file
const MAP_URLS = {
    "IW3": { /* ... */ },
    "IW4": { /* ... */ },
    "IW5": { /* ... */ },
    "IW6": { /* ... */ },
    "T4": { /* ... */ },
    "T5": { /* ... */ },
       "T6": {
        "mp_la": "https://static.wikia.nocookie.net/callofduty/images/b/ba/Aftermath_loading_screen_BOII.png/revision/latest?cb=20130125112538",
        "mp_dockside": "https://static.wikia.nocookie.net/callofduty/images/d/d4/Cargo_loadscreen_BOII.png/revision/latest?cb=20130120072815",
        "mp_carrier": "https://static.wikia.nocookie.net/callofduty/images/8/88/Carrier_loadscreen_BOII.png/revision/latest?cb=20121209072436",
        "mp_drone": "https://static.wikia.nocookie.net/callofduty/images/5/5b/Drone_loadscreen_BOII.png/revision/latest?cb=20121209074205",
        "mp_express": "https://static.wikia.nocookie.net/callofduty/images/d/d1/Express_Load_Screen_BOII.png/revision/latest?cb=20121209074544",
        "mp_hijacked": "https://static.wikia.nocookie.net/callofduty/images/7/79/Hijacked_Load_Screen_BOII.png/revision/latest?cb=20121209075028",
        "mp_meltdown": "https://static.wikia.nocookie.net/callofduty/images/9/92/Meltdown_Load_Screen_BOII.png/revision/latest?cb=20121209075341",
        "mp_overflow": "https://static.wikia.nocookie.net/callofduty/images/8/80/Overflow_Load_Screen_BOII.png/revision/latest?cb=20121209075750",
        "mp_nightclub": "https://static.wikia.nocookie.net/callofduty/images/7/74/Plaza_Load_Screen_BOII.png/revision/latest?cb=20130125112602",
        "mp_raid": "https://static.wikia.nocookie.net/callofduty/images/2/29/Raid_Load_Screen_BOII.png/revision/latest?cb=20121209080157",
        "mp_slums": "https://static.wikia.nocookie.net/callofduty/images/0/04/Slums_Load_Screen_BOII.png/revision/latest?cb=20121209080826",
        "mp_village": "https://static.wikia.nocookie.net/callofduty/images/1/1f/Standoff_Load_Screen_BOII.png/revision/latest?cb=20121209080838",
        "mp_turbine": "https://static.wikia.nocookie.net/callofduty/images/5/50/Turbine_Load_Screen_BOII.png/revision/latest?cb=20121209081207",
        "mp_socotra": "https://static.wikia.nocookie.net/callofduty/images/6/6d/Yemen_Load_Screen_BOII.png/revision/latest?cb=20121209071959",
        "mp_nuketown_2020": "https://static.wikia.nocookie.net/callofduty/images/0/03/Nuketown_2025_Load_Screen_BOII.png/revision/latest?cb=20121217102325",
        "mp_downhill": "https://static.wikia.nocookie.net/callofduty/images/2/28/Downhill_In-Game.jpg/revision/latest?cb=20130201205402",
        "mp_mirage": "https://static.wikia.nocookie.net/callofduty/images/d/d3/Mirage_loadscreen_BOII.png/revision/latest?cb=20140426185229",
        "mp_hydro": "https://static.wikia.nocookie.net/callofduty/images/4/44/Hydro_In-Game.jpg/revision/latest?cb=20130201204341",
        "mp_skate": "https://static.wikia.nocookie.net/callofduty/images/8/86/Grind_In-Game.jpg/revision/latest?cb=20130201203728",
        "mp_concert": "https://static.wikia.nocookie.net/callofduty/images/4/4d/Encore_loadscreen_BOII.png/revision/latest?cb=20130905100408",
        "mp_magma": "https://static.wikia.nocookie.net/callofduty/images/3/30/Magma_loadscreen_BOII.png/revision/latest?cb=20130905100136",
        "mp_vertigo": "https://static.wikia.nocookie.net/callofduty/images/f/f6/Vertigo_loadscreen_BOII.png/revision/latest?cb=20130905095457",
        "mp_studio": "https://static.wikia.nocookie.net/callofduty/images/1/1e/Studio_loadscreen_BOII.png/revision/latest?cb=20130905095718",
        "mp_uplink": "https://static.wikia.nocookie.net/callofduty/images/f/fc/Uplink_loadscreen_BOII.png/revision/latest?cb=20130905095254",
        "mp_bridge": "https://static.wikia.nocookie.net/callofduty/images/0/04/Detour_loadscreen_BOII.png/revision/latest?cb=20130905095021",
        "mp_castaway": "https://static.wikia.nocookie.net/callofduty/images/e/ee/Cove_loadscreen_BOII.png/revision/latest?cb=20130905100640",
        "mp_paintball": "https://static.wikia.nocookie.net/callofduty/images/2/2e/Rush_loadscreen_BOII.png/revision/latest?cb=20130905095938",
        "mp_dig": "https://static.wikia.nocookie.net/callofduty/images/8/83/Dig_loadscreen_BOII.png/revision/latest?cb=20140426105014",
        "mp_frostbite": "https://static.wikia.nocookie.net/callofduty/images/4/43/Frost_loadscreen_BOII.png/revision/latest?cb=20140426105546",
        "mp_pod": "https://static.wikia.nocookie.net/callofduty/images/4/42/Pod_loadscreen_BOII.png/revision/latest?cb=20140426105842",
        "mp_takeoff": "https://static.wikia.nocookie.net/callofduty/images/3/3f/Takeoff_loadscreen_BOII.png/revision/latest?cb=20140426110209",
        "zm_buried": "https://static.wikia.nocookie.net/callofduty/images/7/71/Buried_menu_BOII.png/revision/latest?cb=20161102222409",
        "zm_highrise": "https://static.wikia.nocookie.net/callofduty/images/6/60/Die_Rise_menu_selection_BO2.png/revision/latest?cb=20161102222915",
        "zm_nuked": "https://static.wikia.nocookie.net/callofduty/images/7/74/Nuketown_menu_selection_BO2.png/revision/latest?cb=20161102222934",
        "zm_prison": "https://static.wikia.nocookie.net/callofduty/images/a/aa/Mob_of_the_Dead_menu_selection_BO2.png/revision/latest?cb=20161102222825",
        "zm_tomb": "https://static.wikia.nocookie.net/callofduty/images/b/b2/Origins_Lobby_Icon_BO2.png/revision/latest?cb=20161102222425",
        "zm_transit_dr": "https://static.wikia.nocookie.net/callofduty/images/b/b4/Diner_TranZit_BOII.png/revision/latest?cb=20130224071848",
        "zm_transit": "https://static.wikia.nocookie.net/callofduty/images/f/f9/TranZit_lobby_BOII.png/revision/latest?cb=20161102222339"
    },
    "T7": { /* ... */ }
};