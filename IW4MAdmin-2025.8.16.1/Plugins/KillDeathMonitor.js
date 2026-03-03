plugin = {
    author: "LTDA-lab",
    version: 2.4,
    name: "KillDeathMonitor",

    onEventAsync: function (gameEvent, server) {
        if (!gameEvent || !server) return;

        if (gameEvent.Type === 303) { // evento de muerte
            var origin = gameEvent.Origin;
            var target = gameEvent.Target;
            if (!origin || !target || !server.Clients.includes(origin) || !server.Clients.includes(target)) return;

            // --- Extraer posible nombre de arma (varias rutas) ---
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

            // --- Sanitizar mp_ / _mp de forma robusta ---
            var originalWeapon = weapon ? String(weapon) : null;
            if (weapon) {
                var w = originalWeapon.trim().toLowerCase();

                // Quitar patrones mp_ (en cualquier parte) y _mp (en cualquier parte),
                // pero no tocar "mp" si es parte de algo como "mp5".
                // Esto elimina solo las ocurrencias con guion/underscore alrededor.
                w = w.replace(/mp[_-]+/gi, "");     // mp_  mp-  (inicio o medio)
                w = w.replace(/[_-]+mp/gi, "");     // _mp  -mp  (final o medio)
                // quitar underscores sobrantes al inicio/final
                w = w.replace(/^_+|_+$/g, "");
                if (w.length === 0) w = null;
                weapon = w;
            }

            // --- Si detectamos que había mp en el original y la limpieza no lo quitó,
            //     registrar un log de depuración con un extracto del evento ---
            try {
                var needDebug = false;
                if (originalWeapon && /(^|_|-|\b)mp[_-]?|[_-]?mp($|_|-|\b)/i.test(originalWeapon)) {
                    // si el original contenía mp_/_mp pero el resultado aún contiene "mp_" o "_mp" o está igual,
                    if (!weapon || /mp[_-]|[_-]mp/i.test(originalWeapon) && (originalWeapon.toLowerCase().indexOf(String(weapon || "")) === -1 || /mp[_-]|[_-]mp/i.test(String(weapon || "")))) {
                        needDebug = true;
                    }
                }
                if (needDebug && server.Logger && typeof server.Logger.WriteWarning === "function") {
                    // construir un resumen seguro del evento para log (no volcar TODO si es muy grande)
                    var snippet = {};
                    try {
                        snippet.type = gameEvent.Type;
                        snippet.WeaponName = gameEvent.WeaponName || null;
                        snippet.DataKeys = gameEvent.Data ? Object.keys(gameEvent.Data).slice(0,10) : null;
                        snippet.DataSample = {};
                        if (gameEvent.Data) {
                            var count = 0;
                            for (var k in gameEvent.Data) {
                                if (!gameEvent.Data.hasOwnProperty(k)) continue;
                                // solo añadir campos que parezcan relacionados con arma o control (limitado)
                                if (/weapon|mp|name/i.test(k) && count < 6) {
                                    try { snippet.DataSample[k] = gameEvent.Data[k]; } catch(e){ snippet.DataSample[k] = "[no-read]"; }
                                    count++;
                                }
                            }
                        }
                    } catch(e) { snippet = {err: "error building snippet"}; }

                    var out = "KDMonitor DEBUG: originalWeapon=" + originalWeapon + " | sanitized=" + String(weapon) + " | snippet=" + JSON.stringify(snippet);
                    // limitar largo del log
                    if (out.length > 2000) out = out.slice(0,2000) + "...(truncated)";
                    server.Logger.WriteWarning(out);
                }
            } catch (e) {
                // no hacemos nada crítico si el log falla
            }

            // Armas especiales (opcional)
            var weaponMap = {
                "satchel_charge": "C4"
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
