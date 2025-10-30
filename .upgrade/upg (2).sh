# Примените patch файлы по порядку
git apply create-admin-dashboard.patch
git apply server-with-admin.patch  
git apply mock-data-system.patch
git apply admin-dashboard-components.patch

# Или создайте одну серию patch
git am *.patch

# Проверьте изменения
git status
git diff --staged