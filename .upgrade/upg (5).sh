# Создайте patch файлы
echo "[содержимое admin-messaging-system.patch]" > admin-messaging-system.patch
echo "[содержимое admin-messaging-components.patch]" > admin-messaging-components.patch  
echo "[содержимое update-app-with-messaging.patch]" > update-app-with-messaging.patch

# Примените patch
git apply admin-messaging-system.patch
git apply admin-messaging-components.patch
git apply update-app-with-messaging.patch

# Или одной командой
git am *.patch