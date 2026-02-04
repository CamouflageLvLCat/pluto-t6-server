plugin = {
    author: "LTDA-lab",
    version: 1.1,
    name: "KillDeathMonitor",

    onEventAsync: function (gameEvent, server) {
        if (!gameEvent || !server) return;
        if (gameEvent.Type === 303) {
            var origin = gameEvent.Origin;
            var target = gameEvent.Target;
            if (!origin || !target || !server.Clients.includes(origin) || !server.Clients.includes(target)) return;
            try {
                origin.Tell("^2You ^7killed ^1" + target.Name);
                target.Tell("^1" + origin.Name + " ^7killed ^2You");
            } catch (ex) {
                if (server.Logger && typeof server.Logger.WriteWarning === "function") {
                    server.Logger.WriteWarning("Error al procesar evento de muerte: " + ex.message);
                }
            }
        }
    },

    onLoadAsync: function (manager) { },
    onUnloadAsync: function () { },
    onTickAsync: function (server) { }
};