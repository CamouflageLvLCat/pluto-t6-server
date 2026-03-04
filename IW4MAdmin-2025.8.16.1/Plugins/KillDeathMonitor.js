plugin = {
    author: "LTDA-lab",
    version: 2.5,
    name: "KillDeathMonitor",

    onEventAsync: function (gameEvent, server) {
        if (!gameEvent || !server) return;

        if (gameEvent.Type === 303) { // evento de muerte
            var origin = gameEvent.Origin;
            var target = gameEvent.Target;
            if (!origin || !target || !server.Clients.includes(origin) || !server.Clients.includes(target)) return;

            // --- Extraer posible nombre de arma ---
            var weapon = null;

            if (gameEvent.Data) {
                if (typeof gameEvent.Data.Weapon === "string" && gameEvent.Data.Weapon.length) weapon = gameEvent.Data.Weapon;
                else if (typeof gameEvent.Data.KillerWeapon === "string" && gameEvent.Data.KillerWeapon.length) weapon = gameEvent.Data.KillerWeapon;
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

            // Si weapon es objeto, intentar extraer campos comunes
            if (weapon && typeof weapon !== "string") {
                var candidate = null;
                var propsToTry = ["Name","name","ClassName","className","weaponName","WeaponName","displayName","DisplayName"];
                for (var i = 0; i < propsToTry.length; i++) {
                    var p = propsToTry[i];
                    if (weapon[p] && typeof weapon[p] === "string" && weapon[p].length) {
                        candidate = weapon[p];
                        break;
                    }
                }
                if (candidate) weapon = candidate;
                else {
                    try { weapon = JSON.stringify(weapon); }
                    catch (e) { weapon = String(weapon); }
                }
            }

            // --- Limpiar mp_ / _mp ---
            if (weapon) {
                weapon = String(weapon).trim().toLowerCase();
                weapon = weapon.replace(/^(?:mp[_-]*)+/i, ""); // mp_ al inicio
                weapon = weapon.replace(/(?:[_-]*mp)+$/i, ""); // _mp al final
                weapon = weapon.replace(/^_+|_+$/g, "");        // guiones sobrantes al inicio/final
                // --- Tomar solo la primera parte (arma base) ---
                weapon = weapon.split(/[_-]/)[0];               // elimina accesorios
            }

            // Armas especiales
            var weaponMap = {
                "satchel_charge": "satchel_charge c4"
				"7": "mp7"
            };
            if (weapon && weaponMap[weapon]) weapon = weaponMap[weapon];

            try {
                origin.Tell("^2You ^7killed ^1" + target.Name);
                target.Tell("^1" + origin.Name + " ^7killed ^2You" + (weapon ? " ^7(" + weapon + ")" : ""));
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
