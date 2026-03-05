plugin = {
    author: "LTDA-lab",
    version: 1.3,
    name: "KillDeathMonitor",

    onEventAsync: function (gameEvent, server) {
        if (!gameEvent || !server) return;
        if (gameEvent.Type !== 303) return;

        var origin = gameEvent.Origin;
        var target = gameEvent.Target;

        if (!target || !server.Clients.includes(target)) return;

        // --- Extraer posible arma ---
        var weapon = null;

        if (gameEvent.Data) {
            if (typeof gameEvent.Data.Weapon === "string" && gameEvent.Data.Weapon.length)
                weapon = gameEvent.Data.Weapon;
            else if (typeof gameEvent.Data.KillerWeapon === "string" && gameEvent.Data.KillerWeapon.length)
                weapon = gameEvent.Data.KillerWeapon;
            else {
                for (var key in gameEvent.Data) {
                    if (!gameEvent.Data.hasOwnProperty(key)) continue;
                    var val = gameEvent.Data[key];

                    if (typeof val === "string" && /weapon|mp_|_mp/i.test(val)) {
                        weapon = val;
                        break;
                    }
                }
            }
        }

        if (!weapon && typeof gameEvent.WeaponName === "string") weapon = gameEvent.WeaponName;
        if (!weapon && typeof gameEvent.Weapon === "string") weapon = gameEvent.Weapon;

        // --- LIMPIAR NOMBRE DEL ARMA ---
        if (weapon) {
            weapon = String(weapon).trim().toLowerCase();

            // obtener nombre base antes de _mp (elimina todos los accesorios)
            var match = weapon.match(/^(.+?)_mp/);
            if (match) {
                weapon = match[1];
            }

            // limpiar underscores sobrantes
            weapon = weapon.replace(/^_+|_+$/g, "");
        }

        // Armas especiales
        var weaponMap = {
            "satchel": "c4",
            "7": "mp7"
        };

        if (weapon && weaponMap[weapon]) weapon = weaponMap[weapon];

        try {
            var myName = server.Me?.Name || "";
            var originName = origin ? origin.Name : "Scorestreak";

            // --- Cuando tú matas ---
            if (origin && origin.Name === myName) {
                origin.Tell("^2You ^7killed ^1" + target.Name);
                target.Tell("^1" + origin.Name + " ^7killed ^2" + target.Name);
            }

            // --- Cuando te matan ---
            else if (target.Name === myName) {
                if (origin) {
                    origin.Tell("^2" + origin.Name + " ^7" + (weapon ? "[" + weapon + "] " : "") + "^1" + target.Name);
                }

                target.Tell("^1" + originName + " ^7" + (weapon ? "[" + weapon + "] " : "") + "^2You");
            }

            // --- Otros entre sí ---
            else {
                if (origin) {
                    origin.Tell("^2" + origin.Name + " ^7" + (weapon ? "[" + weapon + "] " : "") + "^1" + target.Name);
                }

                target.Tell("^1" + originName + " ^7" + (weapon ? "[" + weapon + "] " : "") + "^2" + target.Name);
            }

        } catch (ex) {
            if (server.Logger && typeof server.Logger.WriteWarning === "function") {
                server.Logger.WriteWarning("Error al procesar evento de muerte: " + ex.message);
            }
        }
    },

    onLoadAsync: function (manager) { },
    onUnloadAsync: function () { },
    onTickAsync: function (server) { }
};
