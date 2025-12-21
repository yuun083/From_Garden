const API_BASE_URL = 'http://127.0.0.1:8002';

let currentUser = null;
let currentPage = 'home';
let selectedCategory = 'Все';
let selectedSupplierId = null;
let selectedProductId = null;
let currentAdminTab = 'dashboard';
let authMode = 'login';
let currentRating = 5;
let currentAdminPage = 1;
let adminItemsPerPage = 10;
let mobileMenuOpen = false;

// Кэш для данных
let categoriesCache = null;
let suppliersCache = null;



// Добавим в начало файла после объявления переменных
let currentUserCache = null;

// Функция для получения информации о текущем пользователе
async function getCurrentUser() {
    if (!currentUserCache) {
        try {
            currentUserCache = await apiRequest('/auth/me');
        } catch (error) {
            console.error('Ошибка получения пользователя:', error);
            currentUserCache = null;
        }
    }
    return currentUserCache;
}

// Обновим функцию проверки авторизации в DOMContentLoaded
async function checkAuth() {
    try {
        const user = await getCurrentUser();
        if (user) {
            currentUser = user;
            renderNav();
        }
    } catch (error) {
        currentUser = null;
        renderNav();
    }
}





// Функция для загрузки категорий с кэшированием
async function loadCategories() {
    if (!categoriesCache) {
        try {
            const categories = await apiRequest('/categories');
            categoriesCache = categories || [];
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            categoriesCache = [];
        }
    }
    return categoriesCache;
}

// Функция для загрузки ферм/поставщиков с кэшированием
async function loadSuppliers() {
    if (!suppliersCache) {
        try {
            const suppliers = await apiRequest('/farms');
            suppliersCache = suppliers || [];
        } catch (error) {
            console.error('Ошибка загрузки ферм:', error);
            suppliersCache = [];
        }
    }
    return suppliersCache;
}

// Функция для получения названия категории по ID
function getCategoryNameById(categoryId, categories) {
    if (!categoryId || !categories) return 'Без категории';
    
    // Если categoryId - это объект
    if (typeof categoryId === 'object' && categoryId !== null) {
        return categoryId.name || 'Без категории';
    }
    
    // Если categoryId - это число (ID)
    const category = categories.find(c => c.id === parseInt(categoryId));
    return category ? category.name : 'Без категории';
}

// Функция для получения данных фермы по ID
function getFarmById(farmId, farms) {
    if (!farmId || !farms) return null;
    
    // Если farmId - это объект
    if (typeof farmId === 'object' && farmId !== null) {
        return farmId;
    }
    
    // Если farmId - это число (ID)
    const farm = farms.find(f => f.id === parseInt(farmId));
    if (farm) {
        // Добавляем поля для совместимости со старым кодом
        farm.location = farm.address || 'Адрес не указан';
        farm.rating = farm.rating_avg || 0;
        return farm;
    }
    return null;
}

// Функция для получения URL изображения
function getImageUrl(imageData, defaultImage = '/static/images/default-product.jpg') {
    if (!imageData) return defaultImage;
    
    // Если это уже URL
    if (typeof imageData === 'string' && 
        (imageData.startsWith('http://') || imageData.startsWith('https://') || imageData.startsWith('/'))) {
        return imageData;
    }
    
    // Если это base64 данные из базы (предполагаем формат data:image/*;base64,...)
    if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
        return imageData;
    }
    
    // Предполагаем, что изображения хранятся в /static/images/
    return `/static/images/${imageData}`;
}

// Функция для преобразования данных фермы из модели в формат для отображения
function formatFarmData(farm) {
    if (!farm) return null;
    
    return {
        id: farm.id,
        name: farm.name,
        description: farm.description || '',
        location: farm.address || 'Адрес не указан',
        address: farm.address,
        image: farm.image ? `data:image/jpeg;base64,${farm.image}` : '/static/images/default-farm.jpg',
        rating: farm.rating_avg || 0,
        rating_avg: farm.rating_avg || 0,
        user_id: farm.user_id,
        contact_email: farm.contact_email || '',
        contact_phone: farm.contact_phone || '',
        status: farm.status || 'active',
        featured: farm.featured || false // Добавляем поле, если его нет
    };
}

// Функция для преобразования данных продукта из модели в формат для отображения
function formatProductData(product, farms = null, categories = null) {
    if (!product) return null;
    
    // Проверяем наличие продукта
    const isInStock = product.in_stock === true || product.in_stock === 'true' || 
                     (product.quantity !== undefined && product.quantity > 0);
    
    const formattedProduct = {
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price || 0,
        unit: product.unit || 'шт',
        quantity: product.quantity || 0,
        in_stock: isInStock,
        image: product.image ? `data:image/jpeg;base64,${product.image}` : '/static/images/default-product.jpg',
        farm_id: product.farm_id,
        category_id: product.category_id,
        supplier_id: product.farm_id, // Для совместимости со старым кодом
        category: product.category_id // Для совместимости со старым кодом
    };
    
    // Если есть данные о ферме, добавляем их
    if (farms && product.farm_id) {
        const farm = farms.find(f => f.id === product.farm_id);
        if (farm) {
            formattedProduct.supplier = formatFarmData(farm);
        }
    }
    
    // Если есть данные о категории, добавляем их
    if (categories && product.category_id) {
        const category = categories.find(c => c.id === product.category_id);
        if (category) {
            formattedProduct.category_name = category.name;
        }
    }
    
    return formattedProduct;
}


function isAdmin() {
    return currentUser && currentUser.role && currentUser.role.name === 'admin';
}

function isFarmer() {
    return currentUser && currentUser.role && currentUser.role.name === 'farmer';
}

function isCustomer() {
    return currentUser && currentUser.role && currentUser.role.name === 'customer';
}

function getIcon(name) {
    const iconMap = {
        home: '<i class="fas fa-home"></i>',
        package: '<i class="fas fa-box"></i>',
        users: '<i class="fas fa-users"></i>',
        calendar: '<i class="fas fa-calendar-alt"></i>',
        shoppingCart: '<i class="fas fa-shopping-cart"></i>',
        user: '<i class="fas fa-user"></i>',
        store: '<i class="fas fa-store"></i>',
        logout: '<i class="fas fa-sign-out-alt"></i>',
        star: '<i class="fas fa-star" style="color: #fbbf24;"></i>',
        check: '<i class="fas fa-check"></i>',
        x: '<i class="fas fa-times"></i>',
        truck: '<i class="fas fa-truck"></i>',
        clock: '<i class="fas fa-clock"></i>',
        mapPin: '<i class="fas fa-map-marker-alt"></i>',
        edit: '<i class="fas fa-edit"></i>',
        trash: '<i class="fas fa-trash"></i>',
        plus: '<i class="fas fa-plus"></i>',
        minus: '<i class="fas fa-minus"></i>',
        info: '<i class="fas fa-info-circle"></i>',
        crown: '<i class="fas fa-crown"></i>',
    };
    
    return iconMap[name] || '';
}


function showToast(type, title, message = '') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toastId = 'toast-' + Date.now();
    
    const iconMap = {
        success: getIcon('check'),
        error: getIcon('x'),
        info: getIcon('info')
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="toast-icon ${type}">${iconMap[type] || getIcon('info')}</div>
        <div class="toast-content">
            <div class="toast-title">${title || 'Уведомление'}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="closeToast('${toastId}')">${getIcon('x')}</button>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => closeToast(toastId), 4000);
}

function closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBtn = document.getElementById('mobileMenuBtn');
    
    mobileMenuOpen = false;
    
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
    }
    if (menuBtn) {
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
}

function toggleMobileMenu(event) {
    if (event) event.stopPropagation();
    
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBtn = document.getElementById('mobileMenuBtn');
    
    mobileMenuOpen = !mobileMenuOpen;
    
    if (mobileMenu) {
        if (mobileMenuOpen) {
            mobileMenu.classList.add('active');
            if (menuBtn) menuBtn.innerHTML = '<i class="fas fa-times"></i>';
        } else {
            mobileMenu.classList.remove('active');
            if (menuBtn) menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        }
    }
}

function navigateTo(page, data) {
    currentPage = page;
    
    // Закрываем мобильное меню при навигации
    closeMobileMenu();
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) pageElement.classList.add('active');
    
    const activeBtn = document.querySelector(`[onclick*="${page}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    switch(page) {
        case 'home':
            renderHomePage();
            break;
        case 'products':
            renderProducts();
            break;
        case 'suppliers':
            renderSuppliers();
            break;
        case 'supplierDetail':
            selectedSupplierId = data;
            renderSupplierDetail();
            break;
        case 'productDetail':
            selectedProductId = data;
            renderProductDetail();
            break;
        case 'subscriptions':
            renderSubscriptions();
            break;
        case 'cart':
            renderCart();
            break;
        case 'profile':
            renderProfile();
            break;
        case 'admin':
            renderAdminPanel();
            break;
        case 'supplierPanel':
            renderSupplierPanel();
            break;
    }

    window.scrollTo(0, 0);
}

async function renderNav() {
    const nav = document.getElementById('mainNav');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (!currentUser) {
        const navHTML = `
            <button class="nav-btn ${currentPage === 'products' ? 'active' : ''}" onclick="navigateTo('products')">${getIcon('package')} Продукты</button>
            <button class="nav-btn ${currentPage === 'suppliers' ? 'active' : ''}" onclick="navigateTo('suppliers')">${getIcon('users')} Поставщики</button>
            <button class="nav-btn auth-btn" onclick="openAuthModal()">Войти / Регистрация</button>
        `;
        
        if (nav) nav.innerHTML = navHTML;
        if (mobileMenu) mobileMenu.innerHTML = navHTML;
        return;
    }

    let cartCount = 0;
    try {
        const cartItems = await apiRequest('/cart');
        if (cartItems && Array.isArray(cartItems)) {
            cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }
    } catch (error) {
        console.error('Ошибка при получении корзины:', error);
    }
    
    let navHTML = `
        <button class="nav-btn ${currentPage === 'products' ? 'active' : ''}" onclick="navigateTo('products')">${getIcon('package')} Продукты</button>
        <button class="nav-btn ${currentPage === 'suppliers' ? 'active' : ''}" onclick="navigateTo('suppliers')">${getIcon('users')} Поставщики</button>
        <button class="nav-btn ${currentPage === 'subscriptions' ? 'active' : ''}" onclick="navigateTo('subscriptions')">${getIcon('calendar')} Подписки</button>
        <div style="position: relative;">
            <button class="nav-btn ${currentPage === 'cart' ? 'active' : ''}" onclick="navigateTo('cart')">
                ${getIcon('shoppingCart')} Корзина
            </button>
            ${cartCount > 0 ? `<span class="cart-badge">${cartCount}</span>` : ''}
        </div>
        <button class="nav-btn ${currentPage === 'profile' ? 'active' : ''}" onclick="navigateTo('profile')">${getIcon('user')} Профиль</button>
    `;

    if (isAdmin()) {
        navHTML += `<button class="nav-btn admin-btn ${currentPage === 'admin' ? 'active' : ''}" onclick="navigateTo('admin')">${getIcon('crown')} Админ</button>`;
    }

    if (isFarmer()) {
        navHTML += `<button class="nav-btn supplier-btn" onclick="navigateTo('supplierPanel')">${getIcon('store')} Моя ферма</button>`;
    }

    navHTML += `<button class="nav-btn logout-btn" onclick="logout()">${getIcon('logout')} Выход</button>`;

    if (nav) nav.innerHTML = navHTML;
    if (mobileMenu) mobileMenu.innerHTML = navHTML;
}

async function getProductInCartCount(productId) {
    if (!currentUser) return 0;
    try {
        const cartItems = await apiRequest('/cart');
        if (cartItems && Array.isArray(cartItems)) {
            const item = cartItems.find(item => item.product_id === parseInt(productId));
            return item ? item.quantity : 0;
        }
    } catch (error) {
        console.error('Ошибка при получении корзины:', error);
    }
    return 0;
}

function openAuthModal() {
    document.getElementById('authModal').classList.add('active');
    authMode = 'login';
    switchAuthTab('login');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('active');
    const authForm = document.getElementById('authForm');
    if (authForm) authForm.reset();
    const errorDiv = document.getElementById('authError');
    if (errorDiv) errorDiv.style.display = 'none';
}

function switchAuthTab(mode) {
    authMode = mode;
    const isLogin = mode === 'login';
    
    const loginBtn = document.getElementById('loginTabBtn');
    const registerBtn = document.getElementById('registerTabBtn');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const registerFields = document.getElementById('registerFields');
    
    if (loginBtn) loginBtn.className = isLogin ? 'btn btn-primary flex-1' : 'btn btn-secondary flex-1';
    if (registerBtn) registerBtn.className = isLogin ? 'btn btn-secondary flex-1' : 'btn btn-primary flex-1';
    if (authTitle) authTitle.textContent = isLogin ? 'Вход' : 'Регистрация';
    if (authSubmitBtn) authSubmitBtn.textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
    if (registerFields) registerFields.style.display = isLogin ? 'none' : 'block';
}

async function logout() {
    try {
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Ошибка при выходе:', error);
    }
    
    currentUser = null;
    renderNav();
    navigateTo('home');
    showToast('success', 'Вы вышли из системы');
}

async function renderHomePage() {
    try {
        await renderFeaturedSuppliers();
        await renderNewProducts();
        await renderHomeProducts();
    } catch (error) {
        console.error('Ошибка при загрузке главной страницы:', error);
    }
}

async function renderFeaturedSuppliers() {
    try {
        const suppliers = await loadSuppliers();
        if (!suppliers || !Array.isArray(suppliers)) return;
        
        const featuredSuppliers = suppliers
            .map(farm => formatFarmData(farm))
            .filter(s => s && s.rating > 4.0) // Показываем фермы с рейтингом > 4
            .slice(0, 3);
        
        const suppliersHTML = featuredSuppliers.map(supplier => `
            <div class="card clickable" onclick="navigateTo('supplierDetail', '${supplier.id}')">
                <img src="${supplier.image}" alt="${supplier.name}" style="height: 200px; object-fit: cover;">
                <div class="card-content">
                    <div class="flex-between mb-2">
                        <h3 style="font-size: 1.125rem;">${supplier.name}</h3>
                        ${supplier.rating > 0 ? `
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span style="color: #fbbf24;">${getIcon('star')}</span>
                                <span style="font-weight: 600; color: #92400e;">${supplier.rating.toFixed(1)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 0.75rem;">${supplier.description?.substring(0, 100) || ''}...</p>
                    <p class="text-gray" style="font-size: 0.875rem;">${getIcon('mapPin')} ${supplier.location}</p>
                </div>
            </div>
        `).join('');
        
        const featuredSuppliersEl = document.getElementById('featuredSuppliers');
        if (featuredSuppliersEl) {
            featuredSuppliersEl.innerHTML = suppliersHTML || '<p class="text-center text-gray">Нет ферм для показа</p>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке ферм:', error);
        const featuredSuppliersEl = document.getElementById('featuredSuppliers');
        if (featuredSuppliersEl) {
            featuredSuppliersEl.innerHTML = '<p class="text-center text-gray">Ошибка загрузки данных</p>';
        }
    }
}

async function renderNewProducts() {
    try {
        const products = await apiRequest('/products');
        const categories = await loadCategories();
        const farms = await loadSuppliers();
        
        if (!products || !Array.isArray(products)) return;
        
        const newProducts = [...products]
            .map(p => formatProductData(p, farms, categories))
            .filter(p => p) // Убираем null
            .reverse()
            .slice(0, 4);
        
        console.log('Новые продукты для показа:', newProducts.length);
        
        const productsHTML = await Promise.all(newProducts.map(async (product) => {
            if (!product) return '';
            
            const inCartCount = await getProductInCartCount(product.id);
            const categoryName = product.category_name || getCategoryNameById(product.category_id, categories);
            const unit = product.unit || 'шт';
            
            return `
                <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                    <img src="${product.image}" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-content">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="badge badge-green">${categoryName}</span>
                            ${!product.in_stock ? '<span class="badge badge-red" style="margin-left: 0.5rem;">Нет в наличии</span>' : ''}
                        </div>
                        <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                        <div class="flex-between">
                            <div>
                                <span class="product-price">${product.price || 0} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${unit}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn ${inCartCount > 0 ? 'btn-green' : 'btn-primary'} btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')" ${!product.in_stock ? 'disabled style="opacity: 0.5;"' : ''}>
                                    ${inCartCount > 0 ? `${getIcon('check')} ${inCartCount} шт` : '+ В корзину'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }));
        
        const newProductsEl = document.getElementById('newProducts');
        if (newProductsEl) {
            newProductsEl.innerHTML = productsHTML.join('') || '<p class="text-center text-gray">Нет новинок</p>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке новых продуктов:', error);
        const newProductsEl = document.getElementById('newProducts');
        if (newProductsEl) {
            newProductsEl.innerHTML = '<p class="text-center text-gray">Ошибка загрузки данных</p>';
        }
    }
}

async function renderHomeProducts() {
    try {
        const products = await apiRequest('/products');
        const categories = await loadCategories();
        const farms = await loadSuppliers();
        
        if (!products || !Array.isArray(products)) {
            console.error('Продукты не получены или не массив:', products);
            return;
        }
        
        console.log('Получено продуктов:', products.length);
        
        // Создаем список категорий из данных
        const categoriesList = ['Все', ...categories.map(c => c.name)];
        
        const filtersHTML = categoriesList.map(cat => 
            `<button class="category-btn ${cat === selectedCategory ? 'active' : ''}" onclick="filterCategory('${cat}', 'home')">${cat}</button>`
        ).join('');
        
        if (document.getElementById('categoryFiltersHome')) {
            document.getElementById('categoryFiltersHome').innerHTML = filtersHTML;
        }

        let filteredProducts = selectedCategory === 'Все' 
            ? products.map(p => formatProductData(p, farms, categories))
            : products
                .map(p => formatProductData(p, farms, categories))
                .filter(p => p && p.category_name === selectedCategory);
        
        // Отладочная информация
        console.log('Отфильтровано продуктов:', filteredProducts.length);
        console.log('Пример продукта:', filteredProducts[0]);
        
        filteredProducts = filteredProducts.slice(0, 8);

        const productsHTML = await Promise.all(filteredProducts.map(async (product) => {
            if (!product) return '';
            
            const inCartCount = await getProductInCartCount(product.id);
            const categoryName = product.category_name || getCategoryNameById(product.category_id, categories);
            const unit = product.unit || 'шт';
            
            return `
                <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                    <img src="${product.image}" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-content">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="badge badge-green">${categoryName}</span>
                            ${!product.in_stock ? '<span class="badge badge-red" style="margin-left: 0.5rem;">Нет в наличии</span>' : ''}
                        </div>
                        <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">${product.description?.substring(0, 80) || ''}${product.description && product.description.length > 80 ? '...' : ''}</p>
                        <div class="flex-between">
                            <div>
                                <span class="product-price">${product.price || 0} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${unit}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn ${inCartCount > 0 ? 'btn-green' : 'btn-primary'} btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')" ${!product.in_stock ? 'disabled style="opacity: 0.5;"' : ''}>
                                    ${inCartCount > 0 ? `${getIcon('check')} ${inCartCount} шт` : '+ В корзину'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }));

        const productsGridHome = document.getElementById('productsGridHome');
        if (productsGridHome) {
            productsGridHome.innerHTML = productsHTML.join('') || '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-box"></i></div><p>Продукты не найдены</p></div>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке продуктов:', error);
        const productsGridHome = document.getElementById('productsGridHome');
        if (productsGridHome) {
            productsGridHome.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div><p>Ошибка загрузки данных</p></div>';
        }
    }
}

async function renderProducts() {
    try {
        const products = await apiRequest('/products');
        const categories = await loadCategories();
        const farms = await loadSuppliers();
        
        if (!products || !Array.isArray(products)) {
            console.error('Продукты не получены или не массив:', products);
            return;
        }
        
        console.log('Получено продуктов для страницы продуктов:', products.length);
        
        const categoriesList = ['Все', ...categories.map(c => c.name)];
        
        const filtersHTML = categoriesList.map(cat => 
            `<button class="category-btn ${cat === selectedCategory ? 'active' : ''}" onclick="filterCategory('${cat}', 'products')">${cat}</button>`
        ).join('');
        
        if (document.getElementById('categoryFilters')) {
            document.getElementById('categoryFilters').innerHTML = filtersHTML;
        }

        let filteredProducts = selectedCategory === 'Все' 
            ? products.map(p => formatProductData(p, farms, categories))
            : products
                .map(p => formatProductData(p, farms, categories))
                .filter(p => p && p.category_name === selectedCategory);

        console.log('Отфильтровано продуктов для страницы:', filteredProducts.length);

        const productsHTML = await Promise.all(filteredProducts.map(async (product) => {
            if (!product) return '';
            
            const inCartCount = await getProductInCartCount(product.id);
            const categoryName = product.category_name || getCategoryNameById(product.category_id, categories);
            const unit = product.unit || 'шт';
            
            return `
                <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                    <img src="${product.image}" alt="${product.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-content">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="badge badge-green">${categoryName}</span>
                            ${!product.in_stock ? '<span class="badge badge-red" style="margin-left: 0.5rem;">Нет в наличии</span>' : ''}
                        </div>
                        <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">${product.description?.substring(0, 80) || ''}${product.description && product.description.length > 80 ? '...' : ''}</p>
                        <div class="flex-between">
                            <div>
                                <span class="product-price">${product.price || 0} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${unit}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn ${inCartCount > 0 ? 'btn-green' : 'btn-primary'} btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')" ${!product.in_stock ? 'disabled style="opacity: 0.5;"' : ''}>
                                    ${inCartCount > 0 ? `${getIcon('check')} ${inCartCount} шт` : '+ В корзину'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }));

        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = productsHTML.join('') || '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-box"></i></div><p>Продукты не найдены</p></div>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке продуктов:', error);
        const productsGrid = document.getElementById('productsGrid');
        if (productsGrid) {
            productsGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div><p>Ошибка загрузки данных</p></div>';
        }
    }
}

async function filterCategory(category, page) {
    selectedCategory = category;
    
    if (page === 'home') {
        await renderHomeProducts();
    } else {
        await renderProducts();
    }
}

async function addToCart(productId, quantity = 1) {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    try {
        await apiRequest('/cart/items', {
            method: 'POST',
            body: {
                product_id: parseInt(productId),
                quantity: quantity
            }
        });
        
        renderNav();
        
        if (currentPage === 'home') {
            renderHomeProducts();
            renderNewProducts();
        } else if (currentPage === 'products') {
            renderProducts();
        } else if (currentPage === 'productDetail') {
            renderProductDetail();
        }
        
        showToast('success', 'Товар добавлен в корзину!');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось добавить товар в корзину');
        console.error('Ошибка при добавлении в корзину:', error);
    }
}

async function renderSuppliers() {
    try {
        const suppliers = await loadSuppliers();
        if (!suppliers || !Array.isArray(suppliers)) return;
        
        const formattedSuppliers = suppliers.map(farm => formatFarmData(farm));
        
        const suppliersHTML = formattedSuppliers.map(supplier => {
            const location = supplier.location || 'Местоположение не указано';
            const description = supplier.description || '';
            
            return `
                <div class="card clickable" onclick="navigateTo('supplierDetail', '${supplier.id}')">
                    <img src="${supplier.image}" alt="${supplier.name}" style="height: 250px; object-fit: cover;">
                    <div class="card-content">
                        <div class="flex-between mb-2">
                            <h3 style="font-size: 1.125rem;">${supplier.name}</h3>
                            ${supplier.rating > 0 ? `
                                <div style="display: flex; align-items: center; gap: 0.25rem; background: #fef3c7; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                                    <span style="color: #fbbf24;">${getIcon('star')}</span>
                                    <span style="font-weight: 600; color: #92400e;">${supplier.rating.toFixed(1)}</span>
                                </div>
                            ` : ''}
                        </div>
                        <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 0.75rem;">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
                        <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 1rem;">${getIcon('mapPin')} ${location}</p>
                    </div>
                </div>
            `;
        }).join('');
        
        const suppliersGrid = document.getElementById('suppliersGrid');
        if (suppliersGrid) {
            suppliersGrid.innerHTML = suppliersHTML || '<div class="empty-state">Поставщики не найдены</div>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке поставщиков:', error);
        const suppliersGrid = document.getElementById('suppliersGrid');
        if (suppliersGrid) {
            suppliersGrid.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div><p>Ошибка загрузки данных</p></div>';
        }
    }
}

async function renderSupplierDetail() {
    try {
        const suppliers = await loadSuppliers();
        if (!suppliers || !Array.isArray(suppliers)) return;
        
        const supplier = suppliers.find(s => s.id === parseInt(selectedSupplierId));
        if (!supplier) {
            document.getElementById('supplierDetail').innerHTML = '<p class="text-gray">Ферма не найдена</p>';
            return;
        }
        
        const formattedSupplier = formatFarmData(supplier);
        
        const products = await apiRequest('/products');
        const reviews = await apiRequest('/reviews');
        const categories = await loadCategories();
        const farms = await loadSuppliers();
        
        const supplierProducts = products && Array.isArray(products) 
            ? products
                .filter(p => p.farm_id === parseInt(selectedSupplierId))
                .map(p => formatProductData(p, farms, categories))
            : [];
        
        const supplierReviews = reviews && Array.isArray(reviews) 
            ? reviews.filter(r => r.farm_id === parseInt(selectedSupplierId))
            : [];

        let html = `
            <div class="card mb-4">
                <img src="${formattedSupplier.image}" alt="${formattedSupplier.name}" style="width: 100%; height: 400px; object-fit: cover;">
                <div class="card-content">
                    <div class="flex-between mb-2">
                        <div>
                            <h1>${formattedSupplier.name}</h1>
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: #6b7280;">
                                ${getIcon('mapPin')}
                                <span>${formattedSupplier.location}</span>
                            </div>
                        </div>
                        ${formattedSupplier.rating > 0 ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem; background: #fef3c7; padding: 0.75rem 1rem; border-radius: 0.5rem;">
                                <span style="color: #fbbf24; font-size: 1.5rem;">★</span>
                                <span style="font-size: 1.5rem;">${formattedSupplier.rating.toFixed(1)}</span>
                            </div>
                        ` : ''}
                    </div>
                    <p style="color: #374151; line-height: 1.6;">${formattedSupplier.description || ''}</p>
                </div>
            </div>
        `;

        if (supplierProducts.length > 0) {
            html += `
                <h2 class="mb-2">Продукты от ${formattedSupplier.name}</h2>
                <div class="grid grid-4 mb-4">
                    ${supplierProducts.map(product => {
                        const categoryName = product.category_name || getCategoryNameById(product.category_id, categories);
                        return `
                            <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                                <img src="${product.image}" alt="${product.name}" style="height: 150px; object-fit: cover;">
                                <div class="card-content">
                                    <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                                    <p class="product-price">${product.price || 0} ₽ <span class="text-gray" style="font-size: 0.875rem;">/ ${product.unit || 'шт'}</span></p>
                                    <div style="margin-top: 0.5rem;">
                                        <span class="badge badge-green">${categoryName}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        if (supplierReviews.length > 0) {
            html += `
                <h2 class="mb-2">Отзывы</h2>
                <div class="card mb-4">
                    <div class="card-content">
                        ${supplierReviews.map(review => `
                            <div style="border-bottom: 1px solid #e5e7eb; padding: 1rem 0; ${review === supplierReviews[supplierReviews.length - 1] ? 'border-bottom: none;' : ''}">
                                <div class="flex-between mb-2">
                                    <div>
                                        <p style="font-weight: 600;">${review.user_name || 'Анонимный пользователь'}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280;">${new Date(review.created_at).toLocaleDateString('ru-RU')}</p>
                                    </div>
                                    <div style="color: #fbbf24;">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                                </div>
                                <p style="color: #374151;">${review.comment || ''}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Кнопка для добавления отзыва
        if (currentUser && !isFarmer()) {
            html += `
                <button class="btn btn-primary" onclick="showReviewForm()">Оставить отзыв</button>
                <div id="reviewFormContainer" style="display: none; margin-top: 1rem;">
                    <form onsubmit="submitReview(event)" class="card">
                        <div class="card-content">
                            <h3 class="mb-2">Ваш отзыв</h3>
                            <div id="ratingStars" class="mb-2">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <span class="star" onclick="setRating(${i})" style="cursor: pointer; font-size: 1.5rem;">${i <= currentRating ? '★' : '☆'}</span>
                                `).join('')}
                            </div>
                            <textarea id="reviewComment" class="form-input mb-2" rows="3" placeholder="Ваш комментарий"></textarea>
                            <div class="flex gap-1">
                                <button type="submit" class="btn btn-primary">Отправить</button>
                                <button type="button" class="btn btn-secondary" onclick="hideReviewForm()">Отмена</button>
                            </div>
                        </div>
                    </form>
                </div>
            `;
        }

        document.getElementById('supplierDetail').innerHTML = html;
    } catch (error) {
        console.error('Ошибка при загрузке деталей поставщика:', error);
        document.getElementById('supplierDetail').innerHTML = '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

function showReviewForm() {
    currentRating = 5;
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        star.textContent = index < currentRating ? '★' : '☆';
    });
    document.getElementById('reviewFormContainer').style.display = 'block';
    const reviewComment = document.getElementById('reviewComment');
    if (reviewComment) reviewComment.value = '';
}

function hideReviewForm() {
    document.getElementById('reviewFormContainer').style.display = 'none';
}

function setRating(rating) {
    currentRating = rating;
    const stars = document.querySelectorAll('#ratingStars .star');
    stars.forEach((star, index) => {
        star.textContent = index < rating ? '★' : '☆';
    });
}

async function submitReview(e) {
    e.preventDefault();
    
    const commentInput = document.getElementById('reviewComment');
    const comment = commentInput ? commentInput.value : '';

    try {
        await apiRequest('/reviews', {
            method: 'POST',
            body: {
                farm_id: parseInt(selectedSupplierId),
                rating: currentRating,
                comment: comment
            }
        });

        hideReviewForm();
        renderSupplierDetail();
        showToast('success', 'Отзыв опубликован!');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось опубликовать отзыв');
        console.error('Ошибка при отправке отзыва:', error);
    }
}

async function renderProductDetail() {
    try {
        const product = await apiRequest(`/products/${selectedProductId}`);
        if (!product) {
            document.getElementById('productDetail').innerHTML = '<p class="text-gray">Продукт не найден</p>';
            return;
        }
        
        const farms = await loadSuppliers();
        const categories = await loadCategories();
        
        const formattedProduct = formatProductData(product, farms, categories);
        const farm = getFarmById(formattedProduct.farm_id, farms);
        const inCartCount = await getProductInCartCount(formattedProduct.id);
        
        const categoryName = formattedProduct.category_name || getCategoryNameById(formattedProduct.category_id, categories);
        const unit = formattedProduct.unit || 'шт';
        const price = formattedProduct.price || 0;

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 3rem; margin-top: 2rem;">
                <div>
                    <img src="${formattedProduct.image}" alt="${formattedProduct.name}" class="product-main-image" style="width: 100%; height: auto; border-radius: 0.5rem;">
                    
                    <div class="card mb-4">
                        <div class="card-content">
                            <h2>Описание</h2>
                            <p style="color: #374151; line-height: 1.6; margin-top: 1rem;">${formattedProduct.description || ''}</p>
                            
                            <div style="margin-top: 2rem;">
                                <h3 class="mb-2">Характеристики</h3>
                                <div class="product-meta">
                                    <div class="product-meta-item">
                                        ${getIcon('package')}
                                        <span>Категория: ${categoryName}</span>
                                    </div>
                                    <div class="product-meta-item">
                                        ${getIcon('store')}
                                        <span>Ферма: ${farm?.name || 'Неизвестно'}</span>
                                    </div>
                                    <div class="product-meta-item">
                                        ${getIcon('package')}
                                        <span>В наличии: ${formattedProduct.quantity || 0} ${unit}</span>
                                    </div>
                                    ${formattedProduct.in_stock ? `
                                        <div class="product-meta-item">
                                            ${getIcon('check')}
                                            <span style="color: #16a34a;">В наличии</span>
                                        </div>
                                    ` : `
                                        <div class="product-meta-item">
                                            ${getIcon('x')}
                                            <span style="color: #ef4444;">Нет в наличии</span>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="card product-info-card">
                        <div class="card-content">
                            <div class="flex-between mb-2">
                                <h1 style="margin-bottom: 0;">${formattedProduct.name}</h1>
                            </div>
                            
                            <div style="margin-bottom: 0.5rem;">
                                <span class="badge badge-green">${categoryName}</span>
                            </div>
                            
                            ${farm ? `
                                <div class="flex gap-1 mb-3" style="align-items: center;">
                                    ${getIcon('store')}
                                    <span style="color: #6b7280;">
                                        Производитель: 
                                        <a href="javascript:void(0)" onclick="navigateTo('supplierDetail', '${farm.id}')" 
                                           style="color: #16a34a; text-decoration: none;">
                                            ${farm.name}
                                        </a>
                                    </span>
                                </div>
                            ` : ''}
                            
                            <div class="product-price" style="font-size: 2rem; margin-bottom: 1.5rem;">
                                ${price} ₽ <span class="text-gray" style="font-size: 1rem;">/ ${unit}</span>
                            </div>
                            
                            ${inCartCount > 0 ? `
                                <div class="in-cart-indicator">
                                    ${getIcon('check')}
                                    <span>В корзине: <strong>${inCartCount} шт</strong></span>
                                </div>
                            ` : ''}
                            
                            <div class="product-actions">
                                <div class="product-quantity">
                                    <button class="btn btn-secondary" onclick="updateProductQuantity(-1)">-</button>
                                    <input type="number" id="productQuantity" value="1" min="1" max="${formattedProduct.quantity || 100}">
                                    <button class="btn btn-secondary" onclick="updateProductQuantity(1)">+</button>
                                </div>
                                ${formattedProduct.in_stock ? `
                                    <button class="btn btn-primary flex-1" onclick="addToCartFromProductPage()">
                                        ${inCartCount > 0 ? 'Добавить ещё' : 'В корзину'}
                                    </button>
                                ` : `
                                    <button class="btn btn-secondary flex-1" disabled>Нет в наличии</button>
                                `}
                            </div>
                            
                            <div style="border-top: 1px solid #e5e7eb; margin-top: 1.5rem; padding-top: 1.5rem;">
                                <h3 class="mb-2">Информация о доставке</h3>
                                <div class="product-meta">
                                    <div class="product-meta-item">
                                        ${getIcon('truck')}
                                        <span>Доставка за 1-2 дня</span>
                                    </div>
                                    <div class="product-meta-item">
                                        ${getIcon('clock')}
                                        <span>Свежий продукт</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('productDetail').innerHTML = html;
    } catch (error) {
        console.error('Ошибка при загрузке деталей продукта:', error);
        document.getElementById('productDetail').innerHTML = '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

function updateProductQuantity(change) {
    const input = document.getElementById('productQuantity');
    if (!input) return;
    let value = parseInt(input.value) || 1;
    const max = parseInt(input.max) || 100;
    value = Math.max(1, Math.min(max, value + change));
    input.value = value;
}

function addToCartFromProductPage() {
    const input = document.getElementById('productQuantity');
    if (!input) return;
    const quantity = parseInt(input.value) || 1;
    addToCart(selectedProductId, quantity);
}

async function renderSubscriptions() {
    try {
        const subscriptions = await apiRequest('/subscriptions/plans');
        if (!subscriptions || !Array.isArray(subscriptions)) return;
        
        const subscriptionsHTML = subscriptions.map(sub => {
            return `
                <div class="card">
                    <img src="${sub.image || '/static/images/default-subscription.jpg'}" alt="${sub.name}" style="height: 250px; object-fit: cover;">
                    <div class="card-content">
                        <div class="flex-between mb-2">
                            <h3>${sub.name}</h3>
                        </div>
                        <p class="text-gray mb-2">${sub.description || ''}</p>
                        <div class="flex-between">
                            <div>
                                <span style="font-size: 1.5rem; color: #16a34a; font-weight: 700;">${sub.price} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${sub.delivery_frequency || 'неделя'}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn btn-primary" onclick="toggleSubscription('${sub.id}')">
                                    Подписаться
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const subscriptionsGrid = document.getElementById('subscriptionsGrid');
        if (subscriptionsGrid) {
            subscriptionsGrid.innerHTML = subscriptionsHTML || '<p class="text-center text-gray">Нет доступных подписок</p>';
        }
    } catch (error) {
        console.error('Ошибка при загрузке подписок:', error);
        const subscriptionsGrid = document.getElementById('subscriptionsGrid');
        if (subscriptionsGrid) {
            subscriptionsGrid.innerHTML = '<p class="text-center text-gray">Ошибка загрузки данных</p>';
        }
    }
}

async function toggleSubscription(subId) {
    if (!currentUser) {
        openAuthModal();
        return;
    }

    try {
        await apiRequest(`/subscriptions/user/subscribe/${subId}`, {
            method: 'POST'
        });
        
        renderSubscriptions();
        
        if (currentPage === 'profile') {
            renderProfile();
        }
        
        showToast('success', 'Подписка активирована');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось активировать подписку');
        console.error('Ошибка при активации подписки:', error);
    }
}

async function renderCart() {
    if (!currentUser) {
        document.getElementById('cartContent').innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${getIcon('shoppingCart')}</div>
                <p>Войдите, чтобы использовать корзину</p>
                <button class="btn btn-primary mt-2" onclick="openAuthModal()">Войти</button>
            </div>
        `;
        return;
    }

    try {
        const cartItems = await apiRequest('/cart');
        const products = await apiRequest('/products');
        const categories = await loadCategories();
        const farms = await loadSuppliers();

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            document.getElementById('cartContent').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">${getIcon('shoppingCart')}</div>
                    <p>Ваша корзина пуста</p>
                    <p style="color: #9ca3af;">Добавьте продукты, чтобы оформить заказ</p>
                </div>
            `;
            return;
        }

        const total = cartItems.reduce((sum, item) => {
            const product = products && Array.isArray(products) 
                ? formatProductData(products.find(p => p.id === item.product_id), farms, categories)
                : null;
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);

        const html = `
            <div class="cart-layout" style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem; margin-top: 2rem;">
                <div>
                    ${cartItems.map(item => {
                        const product = products && Array.isArray(products) 
                            ? formatProductData(products.find(p => p.id === item.product_id), farms, categories)
                            : null;
                        if (!product) return '';
                        const categoryName = product.category_name || getCategoryNameById(product.category_id, categories);
                        return `
                            <div class="cart-item">
                                <img src="${product.image}" alt="${product.name}" style="width: 100px; height: 100px; object-fit: cover;">
                                <div style="flex: 1;">
                                    <div class="flex-between mb-1">
                                        <div>
                                            <p style="font-weight: 600;">${product.name}</p>
                                            <p style="font-size: 0.875rem; color: #6b7280;">${categoryName}</p>
                                        </div>
                                        <button class="btn btn-secondary btn-small" onclick="removeFromCart('${product.id}')" style="color: #991b1b;">${getIcon('trash')}</button>
                                    </div>
                                    <div class="flex-between">
                                        <div class="quantity-controls">
                                            <button class="quantity-btn" onclick="updateCartItemQuantity('${product.id}', -1)">-</button>
                                            <span style="width: 3rem; text-align: center;">${item.quantity}</span>
                                            <button class="quantity-btn" onclick="updateCartItemQuantity('${product.id}', 1)">+</button>
                                        </div>
                                        <div style="text-align: right;">
                                            <p style="font-size: 0.875rem; color: #6b7280;">${product.price} ₽ / ${product.unit}</p>
                                            <p class="text-green" style="font-weight: 600;">${(product.price * item.quantity).toFixed(2)} ₽</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div>
                    <div class="card" style="position: sticky; top: 100px;">
                        <div class="card-content">
                            <h2 class="mb-4">Оформление заказа</h2>

                            <div class="form-group">
                                <label class="form-label">Адрес доставки</label>
                                <input type="text" class="form-input" id="deliveryAddress" value="${currentUser.address || ''}" placeholder="Введите адрес">
                            </div>

                            <div class="form-group">
                                <label class="form-label">Способ оплаты</label>
                                <select class="form-input" id="paymentMethod">
                                    <option value="card">Банковская карта</option>
                                    <option value="cash">Наличными при получении</option>
                                    <option value="online">Онлайн оплата</option>
                                </select>
                            </div>

                            <div style="border-top: 1px solid #e5e7eb; padding-top: 1rem; margin-top: 1rem;">
                                <div class="flex-between mb-1">
                                    <span class="text-gray">Товары (${cartItems.length})</span>
                                    <span>${total.toFixed(2)} ₽</span>
                                </div>
                                <div class="flex-between mb-1">
                                    <span class="text-gray">Доставка</span>
                                    <span class="text-green">Бесплатно</span>
                                </div>
                                <div class="flex-between mt-2" style="padding-top: 0.5rem; border-top: 1px solid #e5e7eb;">
                                    <span style="font-weight: 600;">Итого</span>
                                    <span class="text-green" style="font-size: 1.5rem; font-weight: 700;">${total.toFixed(2)} ₽</span>
                                </div>
                            </div>

                            <button class="btn btn-primary mt-4" style="width: 100%;" onclick="checkout()">Оформить заказ</button>

                            <p style="font-size: 0.75rem; color: #6b7280; text-align: center; margin-top: 1rem;">
                                Нажимая кнопку, вы соглашаетесь с условиями доставки
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('cartContent').innerHTML = html;
    } catch (error) {
        console.error('Ошибка при загрузке корзины:', error);
        document.getElementById('cartContent').innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-exclamation-circle"></i></div><p>Ошибка загрузки корзины</p></div>';
    }
}

async function updateCartItemQuantity(productId, change) {
    try {
        const cartItems = await apiRequest('/cart');
        const item = cartItems && Array.isArray(cartItems) 
            ? cartItems.find(i => i.product_id === parseInt(productId))
            : null;
        
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
                await removeFromCart(productId);
            } else {
                await apiRequest(`/cart/items/${productId}`, {
                    method: 'PUT',
                    body: { quantity: newQuantity }
                });
            }
        }
        
        renderNav();
        renderCart();
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось обновить количество');
        console.error('Ошибка при обновлении количества:', error);
    }
}

async function removeFromCart(productId) {
    try {
        await apiRequest(`/cart/items/${productId}`, {
            method: 'DELETE'
        });
        
        renderNav();
        renderCart();
        showToast('success', 'Товар удален из корзины');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить товар');
        console.error('Ошибка при удалении из корзины:', error);
    }
}

async function checkout() {
    const addressInput = document.getElementById('deliveryAddress');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    
    if (!addressInput || !paymentMethodSelect) return;
    
    const address = addressInput.value;
    const paymentMethod = paymentMethodSelect.value;

    if (!address) {
        showToast('error', 'Ошибка', 'Пожалуйста, укажите адрес доставки');
        return;
    }

    try {
        // Получаем корзину
        const cartItems = await apiRequest('/cart');
        
        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
            showToast('error', 'Ошибка', 'Корзина пуста');
            return;
        }
        

        



        console.log('Товары в корзине:', cartItems);
        
        // Получаем информацию о товарах в корзине
        const productsPromises = cartItems.map(item => 
            apiRequest(`/products/${item.product_id}`)
        );
        const products = await Promise.all(productsPromises);
        
        console.log('Информация о товарах:', products);
        
        // Проверяем, что все товары получены
        const validProducts = products.filter(p => p);
        if (validProducts.length === 0) {
            showToast('error', 'Ошибка', 'Не удалось получить информацию о товарах');
            return;
        }
        
        // Группируем товары по фермам и рассчитываем суммы
        const ordersByFarm = {};
        cartItems.forEach((item, index) => {
            const product = products[index];
            if (product && product.farm_id) {
                if (!ordersByFarm[product.farm_id]) {
                    ordersByFarm[product.farm_id] = {
                        farm_id: product.farm_id,
                        items: [],
                        total_amount: 0
                    };
                }
                
                const itemTotal = parseFloat(product.price || 0) * parseFloat(item.quantity);
                ordersByFarm[product.farm_id].total_amount += itemTotal;
                
                ordersByFarm[product.farm_id].items.push({
                    product_id: item.product_id,
                    quantity: item.quantity
                });
            }
        });
        
        console.log('Заказы по фермам:', ordersByFarm);
        
        // Создаем заказ для каждой фермы
        const orderPromises = Object.values(ordersByFarm).map(farmOrder => {
            const orderData = {
                delivery_address: address,
                payment_method: paymentMethod,
                farm_id: farmOrder.farm_id,
                total_amount: parseFloat(farmOrder.total_amount.toFixed(2)),
                items: farmOrder.items
            };
            
            console.log('Создание заказа:', orderData);
            
            return apiRequest('/orders', {
                method: 'POST',
                body: orderData
            });
        });
        
        const orderResults = await Promise.all(orderPromises);
        
        console.log('Результаты создания заказов:', orderResults);
        
        // Проверяем успешность создания всех заказов
        const successfulOrders = orderResults.filter(r => r);
        if (successfulOrders.length === 0) {
            // Получаем подробную информацию об ошибке
            const errorText = await response.text();
            console.error('Текст ошибки создания заказа:', errorText);
            
            let errorMessage = 'Не удалось создать ни одного заказа';
            try {
                const errorData = JSON.parse(errorText);
                if (errorData.detail) {
                    if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(err => err.msg || err.detail).join(', ');
                    } else if (typeof errorData.detail === 'object') {
                        errorMessage = errorData.detail.msg || errorData.detail.message || errorData.detail;
                    } else {
                        errorMessage = errorData.detail;
                    }
                }
            } catch (e) {
                console.error('Ошибка парсинга ответа:', e);
            }
            
            throw new Error(errorMessage);
        }

        // Очистка корзины после успешного оформления заказа
        const deletePromises = cartItems.map(item => 
            apiRequest(`/cart/items/${item.product_id}`, {
                method: 'DELETE'
            })
        );
        
        await Promise.all(deletePromises);

        renderNav();
        showToast('success', 'Заказ успешно оформлен!', `Создано ${successfulOrders.length} заказ(ов). Отслеживайте их статус в профиле.`);
        navigateTo('profile');
    } catch (error) {
        console.error('Полная ошибка при оформлении заказа:', error);
        showToast('error', 'Ошибка оформления заказа', error.message || 'Не удалось оформить заказ. Проверьте данные и попробуйте снова.');
    }
}



async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiRequest(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status: newStatus }
        });
        
        showToast('success', 'Статус обновлен', 'Статус заказа успешно изменен');
        renderAdminPanel();
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось обновить статус');
        console.error('Ошибка при обновлении статуса заказа:', error);
    }
}






async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    const config = {
        ...options,
        headers,
        credentials: 'include'
    };
    
    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
        console.log(`Отправка запроса на ${endpoint}:`, config.body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        console.log(`Ответ от ${endpoint}:`, response.status, response.statusText);
        
        if (response.status === 401) {
            currentUser = null;
            renderNav();
            if (endpoint !== '/auth/me') {
                showToast('error', 'Сессия истекла', 'Пожалуйста, войдите снова');
            }
            return null;
        }

        if (response.status === 403) {
            if (endpoint.includes('/admin/')) {
                navigateTo('home');
                showToast('error', 'Доступ запрещен', 'Требуются права администратора');
            }
            return null;
        }

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error(`Ошибка ${response.status} от ${endpoint}:`, error);
            
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            
            if (error.detail) {
                if (Array.isArray(error.detail)) {
                    errorMessage = error.detail.map(err => err.msg || err.detail || errorMessage).join(', ');
                } else if (typeof error.detail === 'object') {
                    errorMessage = error.detail.msg || error.detail.message || error.detail || errorMessage;
                } else {
                    errorMessage = error.detail || errorMessage;
                }
            }
            
            throw new Error(errorMessage);
        }
        
        if (response.status === 204 || response.headers.get('content-length') === '0') {
            return null;
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            showToast('error', 'Ошибка соединения', 'Не удалось подключиться к серверу');
        } else {
            throw error;
        }
    }
}


async function renderProfile() {
    if (!currentUser) {
        document.getElementById('profileContent').innerHTML = '<p class="text-gray">Войдите, чтобы просмотреть профиль</p>';
        return;
    }

    try {
        const userProfile = await apiRequest('/auth/me');
        if (!userProfile) return;
        
        const orders = await apiRequest('/orders');

        // Определяем имя пользователя
        const userName = userProfile.username || userProfile.name || 'Пользователь';
        const userEmail = userProfile.email || 'Email не указан';
        const userAddress = userProfile.address || 'Не указан';
        const userRole = userProfile.role ? userProfile.role.name : 'customer';

        const html = `
            <div class="profile-layout" style="display: grid; grid-template-columns: 350px 1fr; gap: 2rem; margin-top: 2rem;">
                <div>
                    <div class="card">
                        <div class="card-content">
                            <div class="flex-center mb-4">
                                <div style="width: 96px; height: 96px; background: #dcfce7; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem;">
                                    <i class="fas fa-user"></i>
                                </div>
                            </div>

                            <div class="text-center mb-4" id="profileInfo">
                                <h2 style="margin-bottom: 0.25rem;">${userName}</h2>
                                <p class="text-gray" style="font-size: 0.875rem;">${userEmail}</p>
                                <span class="badge ${userRole === 'admin' ? 'badge-green' : userRole === 'farmer' ? 'badge-blue' : 'badge-yellow'}" style="margin-top: 0.5rem;">
                                    ${userRole === 'customer' ? 'Покупатель' : userRole === 'farmer' ? 'Поставщик' : 'Администратор'}
                                </span>
                            </div>

                            <div id="profileDetails" style="margin-bottom: 1.5rem;">
                                <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <span style="color: #9ca3af;">${getIcon('mapPin')}</span>
                                    <div>
                                        <p style="font-size: 0.875rem; color: #6b7280;">Адрес</p>
                                        <p>${userAddress}</p>
                                    </div>
                                </div>
                            </div>

                            <button class="btn btn-primary" style="width: 100%; margin-bottom: 0.5rem;" onclick="showEditProfile()">Редактировать профиль</button>

                            <div id="editProfileForm" style="display: none; margin-top: 1rem;">
                                <form onsubmit="saveProfile(event)">
                                    <div class="form-group">
                                        <label class="form-label">Имя</label>
                                        <input type="text" class="form-input" id="editName" value="${userName}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Адрес</label>
                                        <input type="text" class="form-input" id="editAddress" value="${userAddress}">
                                    </div>
                                    <div class="flex gap-1">
                                        <button type="submit" class="btn btn-primary flex-1">Сохранить</button>
                                        <button type="button" class="btn btn-secondary" onclick="hideEditProfile()">Отмена</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <div class="card mb-4">
                        <div class="card-content">
                            <h2 class="mb-4">${getIcon('clock')} Активные заказы</h2>
                            ${orders && Array.isArray(orders) && orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? 
                                '<p class="text-center text-gray" style="padding: 2rem 0;">Нет активных заказов</p>' : 
                                orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').map(order => `
                                    <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                                        <div class="flex-between mb-2">
                                            <div>
                                                <p style="font-weight: 600;">Заказ №${order.id}</p>
                                                <p style="font-size: 0.875rem; color: #6b7280;">${new Date(order.created_at || order.order_date).toLocaleDateString('ru-RU')}</p>
                                            </div>
                                            <span class="badge badge-yellow">${order.status}</span>
                                        </div>
                                        <div class="flex-between">
                                            <p style="font-size: 0.875rem; color: #6b7280;">Адрес: ${order.address || order.delivery_address}</p>
                                            <p class="text-green" style="font-weight: 600;">${order.total || order.total_amount || 0} ₽</p>
                                        </div>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('profileContent').innerHTML = html;
    } catch (error) {
        console.error('Ошибка при загрузке профиля:', error);
        document.getElementById('profileContent').innerHTML = '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

function showEditProfile() {
    const profileDetails = document.getElementById('profileDetails');
    const editBtn = document.querySelector('#profileContent button[onclick="showEditProfile()"]');
    const editForm = document.getElementById('editProfileForm');
    
    if (profileDetails) profileDetails.style.display = 'none';
    if (editBtn) editBtn.style.display = 'none';
    if (editForm) editForm.style.display = 'block';
}

function hideEditProfile() {
    const profileDetails = document.getElementById('profileDetails');
    const editBtn = document.querySelector('#profileContent button[onclick="showEditProfile()"]');
    const editForm = document.getElementById('editProfileForm');
    
    if (profileDetails) profileDetails.style.display = 'block';
    if (editBtn) editBtn.style.display = 'block';
    if (editForm) editForm.style.display = 'none';
}

async function saveProfile(e) {
    e.preventDefault();

    const nameInput = document.getElementById('editName');
    const addressInput = document.getElementById('editAddress');
    
    if (!nameInput || !addressInput) return;
    
    const name = nameInput.value.trim();
    const address = addressInput.value.trim();

    if (!name || name.length < 3) {
        showToast('error', 'Ошибка', 'Имя должно содержать минимум 3 символа');
        return;
    }
    
    if (!address) {
        showToast('error', 'Ошибка', 'Адрес обязателен');
        return;
    }

    try {
        await apiRequest('/auth/me', {
            method: 'PATCH',
            body: { username: name, address: address }
        });
    

        currentUser.username = name;
        currentUser.address = address;
        
        hideEditProfile();
        renderProfile();
        showToast('success', 'Профиль обновлен');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось обновить профиль');
        console.error('Ошибка при обновлении профиля:', error);
    }
}

function switchAdminTab(tabName, event) {
    event.preventDefault();
    currentAdminTab = tabName;
    currentAdminPage = 1;
    
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    if (event.target) {
        event.target.classList.add('active');
    }
    
    renderAdminPanel();
}

async function renderAdminPanel() {
    if (!isAdmin()) {
        document.getElementById('adminContent').innerHTML = '<p class="text-gray">Доступ запрещен. Требуются права администратора.</p>';
        return;
    }

    const tabsHTML = `
        <div style="display: flex; gap: 1rem; border-bottom: 1px solid #e5e7eb; margin-bottom: 2rem; flex-wrap: wrap;">
            <button class="admin-tab-btn ${currentAdminTab === 'dashboard' ? 'active' : ''}" onclick="switchAdminTab('dashboard', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'dashboard' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'dashboard' ? '2px solid #16a34a' : 'none'};">Статистика</button>
            <button class="admin-tab-btn ${currentAdminTab === 'users' ? 'active' : ''}" onclick="switchAdminTab('users', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'users' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'users' ? '2px solid #16a34a' : 'none'};">Пользователи</button>
            <button class="admin-tab-btn ${currentAdminTab === 'suppliers' ? 'active' : ''}" onclick="switchAdminTab('suppliers', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'suppliers' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'suppliers' ? '2px solid #16a34a' : 'none'};">Фермы</button>
            <button class="admin-tab-btn ${currentAdminTab === 'products' ? 'active' : ''}" onclick="switchAdminTab('products', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'products' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'products' ? '2px solid #16a34a' : 'none'};">Продукты</button>
            <button class="admin-tab-btn ${currentAdminTab === 'orders' ? 'active' : ''}" onclick="switchAdminTab('orders', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'orders' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'orders' ? '2px solid #16a34a' : 'none'};">Заказы</button>
            <button class="admin-tab-btn ${currentAdminTab === 'reviews' ? 'active' : ''}" onclick="switchAdminTab('reviews', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'reviews' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'reviews' ? '2px solid #16a34a' : 'none'};">Отзывы</button>
            <button class="admin-tab-btn ${currentAdminTab === 'categories' ? 'active' : ''}" onclick="switchAdminTab('categories', event)" style="padding: 1rem; border: none; background: none; cursor: pointer; font-weight: ${currentAdminTab === 'categories' ? '600' : '400'}; border-bottom: ${currentAdminTab === 'categories' ? '2px solid #16a34a' : 'none'};">Категории</button>
        </div>
    `;

    let contentHTML = '';
    
    try {
        switch(currentAdminTab) {
            case 'dashboard':
                contentHTML = await renderAdminDashboard();
                break;
            case 'users':
                contentHTML = await renderAdminUsers();
                break;
            case 'suppliers':
                contentHTML = await renderAdminSuppliers();
                break;
            case 'products':
                contentHTML = await renderAdminProducts();
                break;
            case 'orders':
                contentHTML = await renderAdminOrders();
                break;
            case 'reviews':
                contentHTML = await renderAdminReviews();
                break;
            case 'categories':
                contentHTML = await renderAdminCategories();
                break;
            default:
                contentHTML = '<p class="text-gray">Выберите раздел</p>';
        }
    } catch (error) {
        console.error(`Ошибка при загрузке вкладки ${currentAdminTab}:`, error);
        contentHTML = `<p class="text-gray">Ошибка загрузки данных: ${error.message}</p>`;
    }

    document.getElementById('adminContent').innerHTML = tabsHTML + contentHTML;
}

async function renderAdminDashboard() {
    try {
        const stats = await apiRequest('/admin/dashboard');
        
        return `
            <div class="grid grid-3 mb-4">
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Всего пользователей</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #16a34a;">${stats.total_users || 0}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Фермы</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6;">${stats.total_farms || 0}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Продукты</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #f59e0b;">${stats.total_products || 0}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Заказы</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #ef4444;">${stats.total_orders || 0}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Отзывы</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #8b5cf6;">${stats.total_reviews || 0}</p>
                    </div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Ошибка при загрузке статистики:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function renderAdminUsers() {
    try {
        const response = await apiRequest(`/admin/users?page=${currentAdminPage}&per_page=${adminItemsPerPage}`);
        
        if (!response) {
            throw new Error('Некорректный ответ от сервера');
        }
        
        const users = response.users || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;        
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление пользователями (всего: ${total})</h2>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f9fafb;">
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">ID</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Имя</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Email</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Роль</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Адрес</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(user => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 0.75rem;">${user.id}</td>
                                        <td style="padding: 0.75rem;">${user.username}</td>
                                        <td style="padding: 0.75rem;">${user.email}</td>
                                        <td style="padding: 0.75rem;">
                                            <select class="form-input" style="padding: 0.5rem;" onchange="updateUserRole('${user.id}', this.value)">
                                                <option value="customer" ${user.role && user.role.name === 'customer' ? 'selected' : ''}>Покупатель</option>
                                                <option value="farmer" ${user.role && user.role.name === 'farmer' ? 'selected' : ''}>Поставщик</option>
                                                <option value="admin" ${user.role && user.role.name === 'admin' ? 'selected' : ''}>Админ</option>
                                            </select>
                                        </td>
                                        <td style="padding: 0.75rem; font-size: 0.875rem; color: #6b7280;">${user.address || ''}</td>
                                        <td style="padding: 0.75rem;">
                                            <button class="btn btn-danger btn-small" onclick="deleteUser('${user.id}')">${getIcon('trash')}</button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${totalPages > 1 ? `
                        <div class="pagination" style="margin-top: 1rem; text-align: center;">
                            ${currentAdminPage > 1 ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage--; renderAdminPanel()">Назад</button>` : ''}
                            <span style="margin: 0 1rem;">Страница ${currentAdminPage} из ${totalPages}</span>
                            ${currentAdminPage < totalPages ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage++; renderAdminPanel()">Далее</button>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        return html;
    } catch (error) {
        console.error('Ошибка при загрузке пользователей:', error);
        return `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление пользователями</h2>
                    <div class="empty-state">
                        <div class="empty-state-icon">${getIcon('x')}</div>
                        <p>Ошибка загрузки данных</p>
                        <p style="color: #9ca3af; font-size: 0.875rem;">${error.message}</p>
                    </div>
                </div>
            </div>
        `;
    }
}

async function updateUserRole(userId, newRole) {
    try {
        await apiRequest(`/admin/users/${userId}/role`, {
            method: 'PUT',
            body: { new_role: newRole }
        });
        
        showToast('success', 'Роль обновлена', 'Роль пользователя успешно изменена');
        renderAdminPanel();
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось обновить роль');
        console.error('Ошибка при обновлении роли:', error);
    }
}

async function deleteUser(userId) {
    if (!confirm('Удалить пользователя?')) return;
    
    try {
        await apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });
        
        renderAdminPanel();
        showToast('success', 'Пользователь удален');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить пользователя');
        console.error('Ошибка при удалении пользователя:', error);
    }
}

async function renderAdminProducts() {
    try {
        const response = await apiRequest(`/admin/products?page=${currentAdminPage}&per_page=${adminItemsPerPage}`);
        const products = response.products || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        const farms = await apiRequest('/farms');
        const categories = await loadCategories();
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление продуктами (всего: ${total})</h2>
                    <div class="grid grid-3">
                        ${products.map(product => {
                            const farm = farms && Array.isArray(farms) ? farms.find(s => s.id === product.farm_id) : null;
                            const category = categories.find(c => c.id === product.category_id);
                            const formattedProduct = formatProductData(product, farms, categories);
                            
                            return `
                                <div class="card">
                                    <img src="${formattedProduct.image}" alt="${formattedProduct.name}" style="height: 150px; object-fit: cover;">
                                    <div class="card-content">
                                        <p style="font-weight: 600; margin-bottom: 0.25rem;">${formattedProduct.name}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${category ? category.name : 'Без категории'}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${farm ? farm.name : 'Без фермы'}</p>
                                        <p class="text-green mb-2">${formattedProduct.price} ₽ / ${formattedProduct.unit}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">В наличии: ${formattedProduct.quantity} ${formattedProduct.unit}</p>
                                        <div class="flex gap-1">
                                            <button class="btn btn-danger btn-small flex-1" onclick="deleteProduct('${formattedProduct.id}')">${getIcon('trash')}</button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    ${totalPages > 1 ? `
                        <div class="pagination" style="margin-top: 1rem; text-align: center;">
                            ${currentAdminPage > 1 ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage--; renderAdminPanel()">Назад</button>` : ''}
                            <span style="margin: 0 1rem;">Страница ${currentAdminPage} из ${totalPages}</span>
                            ${currentAdminPage < totalPages ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage++; renderAdminPanel()">Далее</button>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        return html;
    } catch (error) {
        console.error('Ошибка при загрузке продуктов:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function deleteProduct(productId) {
    if (!confirm('Удалить продукт?')) return;
    
    try {
        await apiRequest(`/admin/products/${productId}`, {
            method: 'DELETE'
        });
        
        renderAdminPanel();
        showToast('success', 'Продукт удален');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить продукт');
        console.error('Ошибка при удалении продукта:', error);
    }
}

async function renderAdminSuppliers() {
    try {
        const response = await apiRequest(`/admin/farms?page=${currentAdminPage}&per_page=${adminItemsPerPage}`);
        const farms = response.farms || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление фермами (всего: ${total})</h2>
                    ${farms.map(farm => {
                        const formattedFarm = formatFarmData(farm);
                        return `
                            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; display: flex; gap: 1rem;">
                                <img src="${formattedFarm.image}" alt="${formattedFarm.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 0.5rem;">
                                <div style="flex: 1;">
                                    <div class="flex-between mb-1">
                                        <div>
                                            <p style="font-weight: 600;">${formattedFarm.name}</p>
                                            <p style="font-size: 0.875rem; color: #6b7280;">${formattedFarm.location}</p>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 0.25rem;">
                                            <span style="color: #fbbf24;">${getIcon('star')}</span>
                                            <span style="font-weight: 600;">${formattedFarm.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">${formattedFarm.description || ''}</p>
                                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">Email: ${formattedFarm.contact_email || 'Не указан'}</p>
                                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">Телефон: ${formattedFarm.contact_phone || 'Не указан'}</p>
                                    <div class="flex gap-1">
                                        <button class="btn btn-danger btn-small" onclick="deleteSupplier('${formattedFarm.id}')">${getIcon('trash')} Удалить</button>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${totalPages > 1 ? `
                        <div class="pagination" style="margin-top: 1rem; text-align: center;">
                            ${currentAdminPage > 1 ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage--; renderAdminPanel()">Назад</button>` : ''}
                            <span style="margin: 0 1rem;">Страница ${currentAdminPage} из ${totalPages}</span>
                            ${currentAdminPage < totalPages ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage++; renderAdminPanel()">Далее</button>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        return html;
    } catch (error) {
        console.error('Ошибка при загрузке ферм:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function deleteSupplier(supplierId) {
    if (!confirm('Удалить ферму?')) return;
    
    try {
        await apiRequest(`/admin/farms/${supplierId}`, {
            method: 'DELETE'
        });
        
        renderAdminPanel();
        showToast('success', 'Ферма удалена');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить ферму');
        console.error('Ошибка при удалении фермы:', error);
    }
}

async function renderAdminReviews() {
    try {
        const response = await apiRequest(`/admin/reviews?page=${currentAdminPage}&per_page=${adminItemsPerPage}`);
        const reviews = response.reviews || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление отзывами (всего: ${total})</h2>
                    ${reviews.length === 0 ? '<p class="text-center text-gray" style="padding: 2rem 0;">Нет отзывов</p>' :
                        reviews.map(review => `
                            <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                                <div class="flex-between mb-1">
                                    <div>
                                        <p style="font-weight: 600;">${review.user_name || 'Анонимный пользователь'}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280;">
                                            ${new Date(review.created_at).toLocaleDateString('ru-RU')}
                                            ${review.farm_name ? ` | Ферма: ${review.farm_name}` : ''}
                                            ${review.product_name ? ` | Продукт: ${review.product_name}` : ''}
                                        </p>
                                    </div>
                                    <div class="flex gap-1" style="align-items: center;">
                                        <span style="color: #fbbf24;">★ ${review.rating}</span>
                                    </div>
                                </div>
                                <p style="color: #374151; margin-bottom: 0.75rem;">${review.comment || ''}</p>
                                <button class="btn btn-danger btn-small" onclick="deleteReview('${review.id}')">
                                    ${getIcon('trash')} Удалить
                                </button>
                            </div>
                        `).join('')
                    }
                    ${totalPages > 1 ? `
                        <div class="pagination" style="margin-top: 1rem; text-align: center;">
                            ${currentAdminPage > 1 ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage--; renderAdminPanel()">Назад</button>` : ''}
                            <span style="margin: 0 1rem;">Страница ${currentAdminPage} из ${totalPages}</span>
                            ${currentAdminPage < totalPages ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage++; renderAdminPanel()">Далее</button>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        return html;
    } catch (error) {
        console.error('Ошибка при загрузке отзывов:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function deleteReview(reviewId) {
    if (!confirm('Удалить отзыв?')) return;
    
    try {
        await apiRequest(`/admin/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        
        renderAdminPanel();
        showToast('success', 'Отзыв удален');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить отзыв');
        console.error('Ошибка при удалении отзыва:', error);
    }
}

async function renderAdminOrders() {
    try {
        const response = await apiRequest(`/admin/orders?page=${currentAdminPage}&per_page=${adminItemsPerPage}`);
        const orders = response.orders || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление заказами (всего: ${total})</h2>
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f9fafb;">
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">ID</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Покупатель</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Сумма</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Статус</th>
                                    <th style="padding: 0.75rem; border-bottom: 1px solid #e5e7eb; text-align: left;">Дата</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(order => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 0.75rem;">#${order.id}</td>
                                        <td style="padding: 0.75rem;">${order.user_name || 'Неизвестно'}</td>
                                        <td style="padding: 0.75rem;">${order.total_amount || order.total || 0} ₽</td>
                                        <td style="padding: 0.75rem;">
                                            <select class="form-input" style="padding: 0.5rem;" onchange="updateOrderStatus('${order.id}', this.value)">
                                                <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Ожидает</option>
                                                <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>В обработке</option>
                                                <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Отправлен</option>
                                                <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Доставлен</option>
                                                <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Отменен</option>
                                            </select>
                                        </td>
                                        <td style="padding: 0.75rem;">${new Date(order.order_date || order.created_at).toLocaleDateString('ru-RU')}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${totalPages > 1 ? `
                        <div class="pagination" style="margin-top: 1rem; text-align: center;">
                            ${currentAdminPage > 1 ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage--; renderAdminPanel()">Назад</button>` : ''}
                            <span style="margin: 0 1rem;">Страница ${currentAdminPage} из ${totalPages}</span>
                            ${currentAdminPage < totalPages ? `<button class="btn btn-secondary btn-small" onclick="currentAdminPage++; renderAdminPanel()">Далее</button>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        return html;
    } catch (error) {
        console.error('Ошибка при загрузке заказов:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function updateOrderStatus(orderId, newStatus) {
    try {
        await apiRequest(`/admin/orders/${orderId}/status`, {
            method: 'PUT',
            body: { status: newStatus }
        });
        
        showToast('success', 'Статус обновлен', 'Статус заказа успешно изменен');
        renderAdminPanel();
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось обновить статус');
        console.error('Ошибка при обновлении статуса заказа:', error);
    }
}

async function renderAdminCategories() {
    try {
        const categories = await loadCategories();
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <div class="flex-between mb-4">
                        <h2>Управление категориями (всего: ${categories.length})</h2>
                        <button class="btn btn-primary" onclick="showAddCategoryForm()">${getIcon('plus')} Добавить категорию</button>
                    </div>

                    <div id="addCategoryForm" style="display: none; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                        <h3 class="mb-2">Новая категория</h3>
                        <form onsubmit="saveAdminCategory(event)">
                            <div class="flex gap-1">
                                <input type="text" class="form-input flex-1" id="categoryName" placeholder="Название категории" required>
                                <button type="submit" class="btn btn-primary">Добавить</button>
                                <button type="button" class="btn btn-secondary" onclick="hideAddCategoryForm()">Отмена</button>
                            </div>
                        </form>
                    </div>

                    <div class="grid grid-3">
                        ${categories.map(category => `
                            <div class="card">
                                <div class="card-content">
                                    <p style="font-weight: 600; margin-bottom: 0.5rem;">${category.name}</p>
                                    <button class="btn btn-danger btn-small flex-1" onclick="deleteCategory('${category.id}')">${getIcon('trash')} Удалить</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        return html;
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

function showAddCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (form) form.style.display = 'block';
}

function hideAddCategoryForm() {
    const form = document.getElementById('addCategoryForm');
    if (form) form.style.display = 'none';
}

async function saveAdminCategory(e) {
    e.preventDefault();

    const categoryNameInput = document.getElementById('categoryName');
    if (!categoryNameInput) return;
    
    const categoryName = categoryNameInput.value;

    try {
        await apiRequest('/categories', {
            method: 'POST',
            body: { name: categoryName }
        });

        hideAddCategoryForm();
        categoryNameInput.value = '';
        renderAdminPanel();
        showToast('success', 'Категория добавлена');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось добавить категорию');
        console.error('Ошибка при добавлении категории:', error);
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Удалить категорию?')) return;
    
    try {
        await apiRequest(`/categories/${categoryId}`, {
            method: 'DELETE'
        });
        
        renderAdminPanel();
        showToast('success', 'Категория удалена');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить категорию');
        console.error('Ошибка при удалении категории:', error);
    }
}

async function renderSupplierPanel() {
    if (!isFarmer() && !isAdmin()) {
        document.getElementById('supplierPanelContent').innerHTML = `
        <div style="padding: 20px; text-align: center;">
            <p>Доступ запрещен. Только фермеры могут использовать эту панель.</p>
        </div>`;
        return;
    }

    try {
        const farms = await apiRequest('/farms');
        const farm = farms && Array.isArray(farms) 
            ? farms.find(s => s.user_id === currentUser.id)
            : null;
        
        let html = `
            <div class="card mb-4">
                <div class="card-content">
                    <div class="flex-between mb-4">
                        <h2>${getIcon('store')} Моя ферма</h2>
                        ${farm ? `<button class="btn btn-primary" onclick="showEditSupplierPanel()">${getIcon('edit')} Редактировать</button>` : ''}
                    </div>

                    ${farm ? `
                        <div id="supplierInfo">
                            <div class="flex gap-2 mb-4">
                                <img src="${farm.image ? `data:image/jpeg;base64,${farm.image}` : '/static/images/default-farm.jpg'}" alt="${farm.name}" style="width: 128px; height: 128px; object-fit: cover; border-radius: 0.5rem;">
                                <div style="flex: 1;">
                                    <div class="flex gap-1 mb-2" style="align-items: center;">
                                        <h3>${farm.name}</h3>
                                    </div>
                                    <p class="text-gray mb-2">${farm.address}</p>
                                    <p style="color: #374151;">${farm.description || ''}</p>
                                    ${farm.rating_avg > 0 ? `
                                        <p class="mt-1" style="color: #fbbf24;">★ ${farm.rating_avg.toFixed(1)} рейтинг</p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <div id="editSupplierPanelForm" style="display: none; background: #dbeafe; padding: 1rem; border-radius: 0.5rem;">
                            <h3 class="mb-2">Редактировать информацию о ферме</h3>
                            <form onsubmit="saveSupplierPanelInfo(event)" enctype="multipart/form-data">
                                <input type="text" class="form-input mb-2" id="supplierPanelName" value="${farm.name}" placeholder="Название фермы" required>
                                <input type="text" class="form-input mb-2" id="supplierPanelAddress" value="${farm.address}" placeholder="Адрес" required>
                                <textarea class="form-input mb-2" id="supplierPanelDescription" rows="4" required>${farm.description || ''}</textarea>
                                <input type="email" class="form-input mb-2" id="supplierPanelEmail" value="${farm.contact_email || ''}" placeholder="Контактный email">
                                <input type="tel" class="form-input mb-2" id="supplierPanelPhone" value="${farm.contact_phone || ''}" placeholder="Контактный телефон">
                                <input type="file" class="form-input mb-2" id="supplierPanelImage" accept="image/*">
                                <div class="flex gap-1">
                                    <button type="submit" class="btn btn-primary">Сохранить</button>
                                    <button type="button" class="btn btn-secondary" onclick="hideEditSupplierPanel()">Отмена</button>
                                </div>
                            </form>
                        </div>
                    ` : `
                        <div class="text-center" style="padding: 2rem;">
                            <div style="font-size: 4rem; margin-bottom: 1rem;">${getIcon('store')}</div>
                            <p class="text-gray mb-4">У вас пока нет зарегистрированной фермы</p>
                            <button class="btn btn-primary" onclick="showCreateSupplier()">Подать заявку на регистрацию фермы</button>
                        </div>

                        <div id="createSupplierForm" style="display: none; background: #dbeafe; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                            <h3 class="mb-2">Заявка на регистрацию фермы</h3>
                            <form onsubmit="createSupplier(event)" enctype="multipart/form-data">
                                <input type="text" class="form-input mb-2" id="newSupplierName" placeholder="Название фермы" required>
                                <input type="text" class="form-input mb-2" id="newSupplierAddress" placeholder="Адрес" required>
                                <textarea class="form-input mb-2" id="newSupplierDescription" rows="4" placeholder="Описание фермы" required></textarea>
                                <input type="email" class="form-input mb-2" id="newSupplierEmail" placeholder="Контактный email">
                                <input type="tel" class="form-input mb-2" id="newSupplierPhone" placeholder="Контактный телефон">
                                <input type="file" class="form-input mb-2" id="newSupplierImage" accept="image/*">
                                <div class="flex gap-1">
                                    <button type="submit" class="btn btn-primary">Отправить заявку</button>
                                    <button type="button" class="btn btn-secondary" onclick="hideCreateSupplier()">Отмена</button>
                                </div>
                            </form>
                        </div>
                    `}
                </div>
            </div>
        `;

        if (farm) {
            const products = await apiRequest('/products');
            const categories = await loadCategories();
            const supplierProducts = products && Array.isArray(products) 
                ? products
                    .filter(p => p.farm_id === farm.id)
                    .map(p => formatProductData(p, [farm], categories))
                : [];
            
            html += `
                <div class="card">
                    <div class="card-content">
                        <div class="flex-between mb-4">
                            <h2>${getIcon('package')} Мои продукты (${supplierProducts.length})</h2>
                            <button class="btn btn-primary" onclick="showAddSupplierProduct()">${getIcon('plus')} Добавить продукт</button>
                        </div>

                        <div id="addSupplierProductForm" style="display: none; background: #dbeafe; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                            <h3 class="mb-2">Новый продукт</h3>
                            <form onsubmit="saveSupplierProduct(event)" enctype="multipart/form-data">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                                    <input type="text" class="form-input" id="supplierProductName" placeholder="Название" required>
                                    <input type="number" class="form-input" id="supplierProductPrice" placeholder="Цена" required step="0.01">
                                    <input type="text" class="form-input" id="supplierProductUnit" placeholder="Единица (кг, л, шт)" required>
                                    <input type="text" class="form-input" id="supplierProductCategory" placeholder="Категория" required>
                                    <input type="number" class="form-input" id="supplierProductQuantity" placeholder="Количество" required step="0.01">
                                    <input type="checkbox" class="form-checkbox" id="supplierProductInStock" checked>
                                    <label for="supplierProductInStock">В наличии</label>
                                    <input type="file" class="form-input" id="supplierProductImage" accept="image/*" style="grid-column: 1 / -1;">
                                    <textarea class="form-input" id="supplierProductDescription" placeholder="Описание" rows="3" style="grid-column: 1 / -1;"></textarea>
                                </div>
                                <div class="flex gap-1 mt-2">
                                    <button type="submit" class="btn btn-primary">Сохранить</button>
                                    <button type="button" class="btn btn-secondary" onclick="hideAddSupplierProduct()">Отмена</button>
                                </div>
                            </form>
                        </div>

                        ${supplierProducts.length === 0 ? '<p class="text-center text-gray" style="padding: 2rem 0;">У вас пока нет продуктов. Добавьте первый продукт!</p>' : `
                            <div class="grid grid-3">
                                ${supplierProducts.map(product => `
                                    <div class="card">
                                        <img src="${product.image}" alt="${product.name}" style="height: 150px; object-fit: cover;">
                                        <div class="card-content">
                                            <div class="flex-between mb-1">
                                                <div>
                                                    <p style="font-weight: 600; margin-bottom: 0.25rem;">${product.name}</p>
                                                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${product.category_name || 'Без категории'}</p>
                                                </div>
                                                <div class="flex gap-1">
                                                    <button class="btn btn-danger btn-small" onclick="deleteSupplierProduct('${product.id}')">${getIcon('trash')}</button>
                                                </div>
                                            </div>
                                            <p class="text-green mb-2">${product.price} ₽ / ${product.unit}</p>
                                            <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">В наличии: ${product.quantity} ${product.unit}</p>
                                            ${product.in_stock ? '<span class="badge badge-green">В наличии</span>' : '<span class="badge badge-red">Нет в наличии</span>'}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        }

        document.getElementById('supplierPanelContent').innerHTML = html;
    } catch (error) {
        console.error('Ошибка при загрузке панели поставщика:', error);
        document.getElementById('supplierPanelContent').innerHTML = '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

function showCreateSupplier() {
    const form = document.getElementById('createSupplierForm');
    if (form) form.style.display = 'block';
}

function hideCreateSupplier() {
    const form = document.getElementById('createSupplierForm');
    if (form) form.style.display = 'none';
}

async function createSupplier(e) {
    e.preventDefault();

    const formData = new FormData();
    const nameInput = document.getElementById('newSupplierName');
    const addressInput = document.getElementById('newSupplierAddress');
    const descriptionInput = document.getElementById('newSupplierDescription');
    const emailInput = document.getElementById('newSupplierEmail');
    const phoneInput = document.getElementById('newSupplierPhone');
    const imageInput = document.getElementById('newSupplierImage');
    
    if (!nameInput || !addressInput || !descriptionInput) return;
    
    formData.append('name', nameInput.value);
    formData.append('address', addressInput.value);
    formData.append('description', descriptionInput.value);
    
    if (emailInput && emailInput.value) {
        formData.append('contact_email', emailInput.value);
    }
    
    if (phoneInput && phoneInput.value) {
        formData.append('contact_phone', phoneInput.value);
    }
    
    if (!nameInput.value.trim()) {
        showToast('error', 'Ошибка', 'Название фермы обязательно');
        return;
    }

    if (!addressInput.value.trim()) {
        showToast('error', 'Ошибка', 'Адрес обязателен');
        return;
    }




    if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/farms/applications`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Ошибка при отправке заявки');
        }

        showToast('success', 'Заявка отправлена', 'Заявка на регистрацию фермы отправлена администратору');
        hideCreateSupplier();
        renderSupplierPanel();
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось отправить заявку');
        console.error('Ошибка при отправке заявки:', error);
    }
}

function showEditSupplierPanel() {
    const supplierInfo = document.getElementById('supplierInfo');
    const editForm = document.getElementById('editSupplierPanelForm');
    
    if (supplierInfo) supplierInfo.style.display = 'none';
    if (editForm) editForm.style.display = 'block';
}

function hideEditSupplierPanel() {
    const supplierInfo = document.getElementById('supplierInfo');
    const editForm = document.getElementById('editSupplierPanelForm');
    
    if (supplierInfo) supplierInfo.style.display = 'block';
    if (editForm) editForm.style.display = 'none';
}

async function saveSupplierPanelInfo(e) {
    e.preventDefault();

    const formData = new FormData();
    const nameInput = document.getElementById('supplierPanelName');
    const addressInput = document.getElementById('supplierPanelAddress');
    const descriptionInput = document.getElementById('supplierPanelDescription');
    const emailInput = document.getElementById('supplierPanelEmail');
    const phoneInput = document.getElementById('supplierPanelPhone');
    const imageInput = document.getElementById('supplierPanelImage');
    
    if (!nameInput || !addressInput || !descriptionInput) return;
    
    formData.append('name', nameInput.value);
    formData.append('address', addressInput.value);
    formData.append('description', descriptionInput.value);
    
    if (emailInput) {
        formData.append('contact_email', emailInput.value);
    }
    
    if (phoneInput) {
        formData.append('contact_phone', phoneInput.value);
    }
    
    if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const farms = await apiRequest('/farms');
        const farm = farms && Array.isArray(farms) 
            ? farms.find(s => s.user_id === currentUser.id)
            : null;
        
        if (farm) {
            const response = await fetch(`${API_BASE_URL}/farms/${farm.id}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при обновлении информации');
            }
        }

        hideEditSupplierPanel();
        renderSupplierPanel();
        showToast('success', 'Информация обновлена');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось обновить информацию');
        console.error('Ошибка при обновлении информации:', error);
    }
}

function showAddSupplierProduct() {
    const form = document.getElementById('addSupplierProductForm');
    if (form) form.style.display = 'block';
}

function hideAddSupplierProduct() {
    const form = document.getElementById('addSupplierProductForm');
    if (form) form.style.display = 'none';
}

async function saveSupplierProduct(e) {
    e.preventDefault();

    const formData = new FormData();
    const nameInput = document.getElementById('supplierProductName');
    const priceInput = document.getElementById('supplierProductPrice');
    const unitInput = document.getElementById('supplierProductUnit');
    const categoryInput = document.getElementById('supplierProductCategory');
    const quantityInput = document.getElementById('supplierProductQuantity');
    const inStockInput = document.getElementById('supplierProductInStock');
    const descriptionInput = document.getElementById('supplierProductDescription');
    const imageInput = document.getElementById('supplierProductImage');
    
    // Валидация обязательных полей
    if (!nameInput || !nameInput.value.trim()) {
        showToast('error', 'Ошибка', 'Название продукта обязательно');
        return;
    }
    
    const price = parseFloat(priceInput.value);
    const quantity = parseFloat(quantityInput.value);
    
    if (isNaN(price) || price <= 0) {
        showToast('error', 'Ошибка', 'Цена должна быть положительным числом');
        return;
    }
    
    if (isNaN(quantity) || quantity < 0) {
        showToast('error', 'Ошибка', 'Количество не может быть отрицательным');
        return;
    }
    
    if (!unitInput.value.trim()) {
        showToast('error', 'Ошибка', 'Единица измерения обязательна');
        return;
    }
    
    if (!categoryInput.value.trim()) {
        showToast('error', 'Ошибка', 'Категория обязательна');
        return;
    }

    formData.append('price', price.toFixed(2));
    formData.append('quantity', quantity);
    
    if (!nameInput || !priceInput || !unitInput || !categoryInput || !quantityInput) return;
    
    // Сначала получаем или создаем категорию
    let categoryId;
    try {
        const categories = await loadCategories();
        let category = categories.find(c => c.name.toLowerCase() === categoryInput.value.toLowerCase());
        
        if (!category) {
            // Создаем новую категорию
            const newCategory = await apiRequest('/categories', {
                method: 'POST',
                body: { name: categoryInput.value }
            });
            categoryId = newCategory.id;
            // Обновляем кэш категорий
            categoriesCache = null;
            await loadCategories();
        } else {
            categoryId = category.id;
        }
    } catch (error) {
        console.error('Ошибка при работе с категорией:', error);
        showToast('error', 'Ошибка', 'Не удалось создать или найти категорию');
        return;
    }
    
    formData.append('name', nameInput.value);
    formData.append('price', priceInput.value);
    formData.append('unit', unitInput.value);
    formData.append('category_id', categoryId);
    formData.append('quantity', quantityInput.value);
    formData.append('in_stock', inStockInput.checked ? 'true' : 'false');
    formData.append('description', descriptionInput.value || '');
    
    if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const farms = await apiRequest('/farms');
        const farm = farms && Array.isArray(farms) 
            ? farms.find(s => s.user_id === currentUser.id)
            : null;
        
        if (farm) {
            formData.append('farm_id', farm.id);
            
            const response = await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Ошибка при добавлении продукта');
            }
        }

        hideAddSupplierProduct();
        renderSupplierPanel();
        showToast('success', 'Продукт добавлен');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось добавить продукт');
        console.error('Ошибка при добавлении продукта:', error);
    }
}

async function deleteSupplierProduct(productId) {
    if (!confirm('Удалить продукт?')) return;

    try {
        await apiRequest(`/products/${productId}`, {
            method: 'DELETE'
        });
        
        renderSupplierPanel();
        showToast('success', 'Продукт удален');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить продукт');
        console.error('Ошибка при удалении продукта:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const errorDiv = document.getElementById('authError');
            
            try {
                if (authMode === 'register') {
                    const name = document.getElementById('authName').value;
                    const address = document.getElementById('authAddress').value;
                    
                    if (!email || !password || !name || !address) {
                        errorDiv.textContent = 'Пожалуйста, заполните все поля';
                        errorDiv.style.display = 'block';
                        return;
                    }

                    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            email,
                            username: name,
                            password,
                            address
                        }),
                        credentials: 'include'
                    });
                    
                    if (!registerResponse.ok) {
                        const error = await registerResponse.json().catch(() => ({}));
                        if (Array.isArray(error.detail)) {
                            errorDiv.textContent = error.detail.map(err => err.msg || err.detail || 'Ошибка регистрации').join(', ');
                        } else if (typeof error.detail === 'object' && error.detail !== null) {
                            errorDiv.textContent = error.detail.msg || error.detail.message || error.detail || 'Ошибка регистрации: ' + registerResponse.statusText;
                        } else {
                            errorDiv.textContent = error.detail || 'Ошибка регистрации: ' + registerResponse.statusText;
                        }
                        errorDiv.style.display = 'block';
                        return;
                    }
                }

                const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        email,
                        password
                    }),
                    credentials: 'include'
                });
                
                if (!loginResponse.ok) {
                    const error = await loginResponse.json().catch(() => ({}));
                    if (Array.isArray(error.detail)) {
                        errorDiv.textContent = error.detail.map(err => err.msg || err.detail || 'Неверный email или пароль').join(', ');
                    } else if (typeof error.detail === 'object' && error.detail !== null) {
                        errorDiv.textContent = error.detail.msg || error.detail.message || error.detail || 'Неверный email или пароль';
                    } else {
                        errorDiv.textContent = error.detail || 'Неверный email или пароль';
                    }
                    errorDiv.style.display = 'block';
                    return;
                }
                
                const userResponse = await apiRequest('/auth/me');
                if (userResponse) {
                    currentUser = userResponse;
                    
                    closeAuthModal();
                    renderNav();
                    
                    if (isAdmin()) {
                        navigateTo('admin');
                        showToast('success', 'Добро пожаловать, администратор!');
                    } else if (isFarmer()) {
                        navigateTo('supplierPanel');
                        showToast('success', 'Добро пожаловать, фермер!');
                    } else {
                        navigateTo('home');
                        showToast('success', 'Добро пожаловать!');
                    }
                    return;
                }
            } catch (error) {
                console.error('Ошибка авторизации:', error);
                if (error.message.includes('Failed to fetch')) {
                    errorDiv.textContent = 'Ошибка подключения к серверу. Проверьте, что сервер запущен.';
                } else {
                    errorDiv.textContent = 'Ошибка: ' + error.message;
                }
                errorDiv.style.display = 'block';
            }
        });
    }

    async function checkAuth() {
        try {
            const user = await apiRequest('/auth/me');
            if (user) {
                currentUser = user;
                renderNav();
            }
        } catch (error) {
            currentUser = null;
            renderNav();
        }
    }

    checkAuth();
    renderNav();
    renderHomePage();

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }

    // Закрытие мобильного меню при клике вне его
    document.addEventListener('click', function(e) {
        const mobileMenu = document.getElementById('mobileMenu');
        const menuBtn = document.getElementById('mobileMenuBtn');
        
        if (mobileMenuOpen && mobileMenu && menuBtn) {
            if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                closeMobileMenu();
            }
        }
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && mobileMenuOpen) {
            closeMobileMenu();
        }
    });
});
