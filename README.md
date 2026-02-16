amazon ubuntu-jammy-22.04:

c7i-flex.large 2 cpu 4 GiB c3.large 2 cpu 3,75 GiB

dotnet-runtime-8.0

```c++
# Actualizar sistema e instalar utilidades básicas
sudo apt update && \
sudo apt upgrade -y && \
sudo apt install -y git nano wget curl gnupg2 software-properties-common apt-transport-https ufw htop screen

# Configurar arquitectura i386 para Wine
sudo dpkg --add-architecture i386

# Crear keyrings y agregar clave de WineHQ
sudo mkdir -pm755 /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/winehq-archive.key https://dl.winehq.org/wine-builds/winehq.key

# Agregar repositorio WineHQ
sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/jammy/winehq-jammy.sources

# Actualizar repositorios e instalar Wine estable
sudo apt update && \
sudo apt install --install-recommends winehq-stable -y

# Agregar repositorio oficial de Microsoft
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
sudo dpkg -i packages-microsoft-prod.deb && \
rm packages-microsoft-prod.deb

# Actualizar repositorios
sudo apt update

# Instalar .NET Runtime 8 y ASP.NET Core Runtime 8
sudo apt install -y dotnet-runtime-8.0 aspnetcore-runtime-8.0

# Configurar variables de entorno solo para Wine
echo -e 'export WINEPREFIX=~/.wine\nexport WINEDEBUG=fixme-all\nexport WINEARCH=win64\nexport DISPLAY=:0' >> ~/.bashrc

# Recargar configuración de bash
source ~/.bashrc

# Verificación
dotnet --info
wine --version

```

--------------------------------------------------------




eliminar todos los rastros de .NET Runtime 8 y ASP.NET Core Runtime 8 de tu sistema Ubuntu/Debian, incluyendo paquetes, configuraciones, caches y symlinks

```c++
# 1. Desinstalar los paquetes y purgar configuraciones
sudo apt remove --purge -y dotnet-runtime-8.0 aspnetcore-runtime-8.0 dotnet-sdk-8.0

# 2. Limpiar dependencias huérfanas
sudo apt autoremove -y

# 3. Borrar caches de apt
sudo apt clean

# 4. Eliminar directorios comunes de .NET 8 (si existen)
sudo rm -rf /usr/share/dotnet/dotnet-runtime-8.0
sudo rm -rf /usr/share/dotnet/aspnetcore-runtime-8.0

# 5. Eliminar symlinks globales si los hubiera
sudo rm -f /usr/bin/dotnet
```

---------------------------------------------------------------

eliminar todos los rastros de .NET Runtime 8 y ASP.NET Core Runtime 8 de tu sistema Ubuntu/Debian, incluyendo paquetes, configuraciones, caches y symlinks

```c++
# 1. Desinstalar los paquetes y purgar configuraciones
sudo apt remove --purge -y dotnet-runtime-10.0 aspnetcore-runtime-10.0 dotnet-sdk-10.0

# 2. Limpiar dependencias huérfanas
sudo apt autoremove -y

# 3. Borrar caches de apt
sudo apt clean

# 4. Eliminar directorios comunes de .NET 10 (si existen)
sudo rm -rf /usr/share/dotnet/dotnet-runtime-10.0
sudo rm -rf /usr/share/dotnet/aspnetcore-runtime-10.0

# 5. Eliminar symlinks globales si los hubiera
sudo rm -f /usr/bin/dotnet
```



amazon ubuntu-jammy-22.04:

c7i-flex.large 2 cpu 4 GiB c3.large 2 cpu 3,75 GiB

.NET 10 SDK




```c++
# Actualizar sistema e instalar utilidades básicas
sudo apt update && \
sudo apt upgrade -y && \
sudo apt install -y git nano wget curl gnupg2 software-properties-common apt-transport-https ufw htop screen

# Configurar arquitectura i386 para Wine
sudo dpkg --add-architecture i386

# Crear keyrings y agregar clave de WineHQ
sudo mkdir -pm755 /etc/apt/keyrings
sudo wget -O /etc/apt/keyrings/winehq-archive.key https://dl.winehq.org/wine-builds/winehq.key

# Agregar repositorio WineHQ
sudo wget -NP /etc/apt/sources.list.d/ https://dl.winehq.org/wine-builds/ubuntu/dists/jammy/winehq-jammy.sources

# Actualizar repositorios e instalar Wine estable
sudo apt update && \
sudo apt install --install-recommends winehq-stable -y

# Descargar e instalar repositorio de Microsoft para .NET
wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb && \
sudo dpkg -i packages-microsoft-prod.deb && \
rm packages-microsoft-prod.deb

# Actualizar repositorios
sudo apt update

# Instalar .NET 10 SDK usando el script oficial de Microsoft
wget https://dot.net/v1/dotnet-install.sh -O ~/dotnet-install.sh && \
chmod +x ~/dotnet-install.sh && \
~/dotnet-install.sh --channel 10.0

# Configurar variables de entorno para .NET 10 y Wine
echo -e 'export DOTNET_ROOT=$HOME/.dotnet\nexport PATH=$PATH:$HOME/.dotnet:$HOME/.dotnet/tools\nexport WINEPREFIX=~/.wine\nexport WINEDEBUG=fixme-all\nexport WINEARCH=win64\nexport DISPLAY=:0' >> ~/.bashrc

# Recargar configuración de bash
source ~/.bashrc

# Verificación
dotnet --list-sdks
dotnet --version
wine --version
```
--------------------------------------------------------

```c++
git clone https://github.com/CamouflageLvLCat/pluto-t6-server.git
```
```c++
CamouflageLvLCat
```

```c++
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
```

--------------------------------------------------------
Instalar Nginx:

```c++
sudo apt update 
sudo apt upgrade -y
```

```c++
sudo apt install nginx -y
```

verificar que este activo:

```c++
sudo systemctl status nginx
```


Habilitar Nginx al iniciar el sistema:

```c++
sudo systemctl enable nginx
```



permisos:

```c++
find /home/ubuntu/pluto-t6-server -type d -exec chmod 755 {} \; && find /home/ubuntu/pluto-t6-server -type f -exec chmod 644 {} \; && find /home/ubuntu/pluto-t6-server -type f -name "*.sh" -exec chmod 755 {} \; && find /home/ubuntu/pluto-t6-server -type f -name "*.bat" -exec chmod 755 {} \;
```

verificar:

```c++
ls -ld /home/ubuntu/pluto-t6-server
ls -l /home/ubuntu/pluto-t6-server
```

--------------------------------------------------------


Cambiar la zona horaria a São Paulo

Ver las zonas horarias de Brasil disponibles

```c++
timedatectl list-timezones | grep Brazil
```


```c++
sudo timedatectl set-timezone America/Sao_Paulo
```

Verificar el cambio

```c++
timedatectl
```


--------------------------------------------------------



Iniciar servidores:

```c++
screen -S t6-1
```

```c++
cd /home/ubuntu/pluto-t6-server
chmod +x pluto1.sh 
./pluto1.sh mp
```
 
--------------------------------------------------------


```c++
screen -S t6-2
```

```c++
cd /home/ubuntu/pluto-t6-server
chmod +x pluto2.sh 
./pluto2.sh mp 
 ```

--------------------------------------------------------

```c++
screen -S t6-3
```


```c++
cd /home/ubuntu/pluto-t6-server
chmod +x pluto3.sh 
./pluto3.sh mp
```

----------------------------------------------------------------------

```c++
screen -S IW4Madmin
```

```c++
cd /home/ubuntu/pluto-t6-server/IW4MAdmin-2025.8.16.1
chmod +x StartIW4MAdmin.sh 
./StartIW4MAdmin.sh
```

```c++
!sp jkjkjk
```













