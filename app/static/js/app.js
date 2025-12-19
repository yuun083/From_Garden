const API_BASE_URL = 'http://127.0.0.1:8002';

let currentUser = null;

function isAdmin() {
    return currentUser && currentUser.role === 'admin';
}

function isSupplier() {
    return currentUser && currentUser.role === 'farmer';
}

function isCustomer() {
    return currentUser && currentUser.role === 'customer';
}
let currentPage = 'home';
let selectedCategory = 'Все';
let selectedSupplierId = null;
let selectedProductId = null;
let currentAdminTab = 'dashboard';
let authMode = 'login';
let currentRating = 5;
let currentProductRating = 5;
let currentAdminPage = 1;
let adminItemsPerPage = 10;

function getIcon(name) {
    const iconMap = {
        home: '<i class="fas fa-home"></i>',
        package: '<i class="fas fa-box"></i>',
        users: '<i class="fas fa-users"></i>',
        calendar: '<i class="fas fa-calendar-alt"></i>',
        shoppingCart: '<i class="fas fa-shopping-cart"></i>',
        user: '<i class="fas fa-user"></i>',
        settings: '<i class="fas fa-cog"></i>',
        store: '<i class="fas fa-store"></i>',
        logout: '<i class="fas fa-sign-out-alt"></i>',
        star: '<i class="fas fa-star" style="color: #fbbf24;"></i>',
        starEmpty: '<i class="far fa-star" style="color: #fbbf24;"></i>',
        check: '<i class="fas fa-check"></i>',
        x: '<i class="fas fa-times"></i>',
        alert: '<i class="fas fa-exclamation-circle"></i>',
        truck: '<i class="fas fa-truck"></i>',
        clock: '<i class="fas fa-clock"></i>',
        mapPin: '<i class="fas fa-map-marker-alt"></i>',
        edit: '<i class="fas fa-edit"></i>',
        trash: '<i class="fas fa-trash"></i>',
        plus: '<i class="fas fa-plus"></i>',
        minus: '<i class="fas fa-minus"></i>',
        info: '<i class="fas fa-info-circle"></i>',
        arrowLeft: '<i class="fas fa-arrow-left"></i>',
        eye: '<i class="fas fa-eye"></i>',
        messageCircle: '<i class="far fa-comment-alt"></i>',
        crown: '<i class="fas fa-crown"></i>',
        tractor: '<i class="fas fa-tractor"></i>',
        carrot: '<i class="fas fa-carrot"></i>',
        smile: '<i class="fas fa-smile"></i>',
        seed: '<i class="fas fa-seedling"></i>',
        heart: '<i class="fas fa-heart"></i>',
        share: '<i class="fas fa-share"></i>',
    };
    
    return iconMap[name] || '';
}

async function apiRequest(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Основная аутентификация происходит через куки, но оставим возможность
    // использовать заголовок Authorization, если токен доступен в localStorage
    const token = localStorage.getItem('access_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Используем куки для аутентификации, как задумано на сервере
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include' // Включаем куки в запросы
    });
    
    if (response.status === 401) {
        // Очищаем данные пользователя при 401 ошибке
        // Удаляем токен из localStorage, если он там есть
        localStorage.removeItem('access_token');
        currentUser = null;
        renderNav();
        // Показываем сообщение об ошибке только если это не проверка аутентификации при загрузке страницы
        if (endpoint !== '/auth/me') {
            showToast('error', 'Сессия истекла', 'Пожалуйста, войдите снова');
        }
        return null;
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        // Проверяем, является ли error.detail массивом или объектом
        if (Array.isArray(error.detail)) {
            // Если это массив ошибок, объединяем их в строку
            errorMessage = error.detail.map(err => err.msg || err.detail || errorMessage).join(', ');
        } else if (typeof error.detail === 'object' && error.detail !== null) {
            // Если это объект, извлекаем сообщение
            errorMessage = error.detail.msg || error.detail.message || error.detail || errorMessage;
        } else {
            // В противном случае используем строку напрямую
            errorMessage = error.detail || errorMessage;
        }
        
        throw new Error(errorMessage);
    }
    
    if (response.status === 204) {
        return null;
    }
    
    return await response.json();
}

function showToast(type, title, message) {
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
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBtn = document.getElementById('mobileMenuBtn');
    
    mobileMenu.classList.toggle('active');
    menuBtn.innerHTML = mobileMenu.classList.contains('active') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
    
    if (event) event.stopPropagation();
}

document.addEventListener('click', function(e) {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBtn = document.getElementById('mobileMenuBtn');
    
    if (mobileMenu && mobileMenu.classList.contains('active') && 
        !mobileMenu.contains(e.target) && 
        !menuBtn.contains(e.target)) {
        mobileMenu.classList.remove('active');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
});

function navigateTo(page, data) {
    currentPage = page;
    
    const mobileMenu = document.getElementById('mobileMenu');
    const menuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenu) {
        mobileMenu.classList.remove('active');
        menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    }
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    
    const pageElement = document.getElementById(page + 'Page');
    if (pageElement) {
        pageElement.classList.add('active');
    }

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`[onclick*="${page}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

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
        nav.innerHTML = `
            <button class="nav-btn ${currentPage === 'products' ? 'active' : ''}" onclick="navigateTo('products')">${getIcon('package')} Продукты</button>
            <button class="nav-btn ${currentPage === 'suppliers' ? 'active' : ''}" onclick="navigateTo('suppliers')">${getIcon('users')} Поставщики</button>
            <button class="nav-btn auth-btn" onclick="openAuthModal()">Войти / Регистрация</button>
        `;
        
        if (mobileMenu) {
            mobileMenu.innerHTML = `
                <button class="nav-btn ${currentPage === 'products' ? 'active' : ''}" onclick="navigateTo('products')">${getIcon('package')} Продукты</button>
                <button class="nav-btn ${currentPage === 'suppliers' ? 'active' : ''}" onclick="navigateTo('suppliers')">${getIcon('users')} Поставщики</button>
                <button class="nav-btn auth-btn" onclick="openAuthModal()">Войти / Регистрация</button>
            `;
        }
        return;
    }

    let cartCount = 0;
    try {
        const cartItems = await apiRequest('/cart');
        if (cartItems) {
            cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
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

    let mobileNavHTML = `
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
        navHTML += `<button class="nav-btn admin-btn" onclick="navigateTo('admin')">${getIcon('settings')} Админ</button>`;
        mobileNavHTML += `<button class="nav-btn admin-btn" onclick="navigateTo('admin')">${getIcon('settings')} Админ</button>`;
    }

    if (isSupplier()) {
        navHTML += `<button class="nav-btn supplier-btn" onclick="navigateTo('supplierPanel')">${getIcon('store')} Моя ферма</button>`;
        mobileNavHTML += `<button class="nav-btn supplier-btn" onclick="navigateTo('supplierPanel')">${getIcon('store')} Моя ферма</button>`;
    }

    navHTML += `<button class="nav-btn logout-btn" onclick="logout()">${getIcon('logout')} Выход</button>`;
    mobileNavHTML += `<button class="nav-btn logout-btn" onclick="logout()">${getIcon('logout')} Выход</button>`;

    nav.innerHTML = navHTML;
    if (mobileMenu) {
        mobileMenu.innerHTML = mobileNavHTML;
    }
}

async function getProductInCartCount(productId) {
    if (!currentUser) return 0;
    try {
        const cartItems = await apiRequest('/cart');
        if (cartItems) {
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
    document.getElementById('authForm').reset();
    document.getElementById('authError').style.display = 'none';
}

function switchAuthTab(mode) {
    authMode = mode;
    const isLogin = mode === 'login';
    
    document.getElementById('loginTabBtn').className = isLogin ? 'btn btn-primary flex-1' : 'btn btn-secondary flex-1';
    document.getElementById('registerTabBtn').className = isLogin ? 'btn btn-secondary flex-1' : 'btn btn-primary flex-1';
    document.getElementById('authTitle').textContent = isLogin ? 'Вход' : 'Регистрация';
    document.getElementById('authSubmitBtn').textContent = isLogin ? 'Войти' : 'Зарегистрироваться';
    document.getElementById('registerFields').style.display = isLogin ? 'none' : 'block';
    
    if (!isLogin) {
        document.getElementById('authName').required = true;
        document.getElementById('authAddress').required = true;
    } else {
        document.getElementById('authName').required = false;
        document.getElementById('authAddress').required = false;
    }
}

async function logout() {
    try {
        // Выполняем logout на сервере
        await apiRequest('/auth/logout', { method: 'POST' });
    } catch (error) {
        console.error('Ошибка при выходе:', error);
        // Даже если запрос к серверу не удался, удаляем токен из локального хранилища
        showToast('error', 'Ошибка', error.message || 'Не удалось выйти из системы');
    }
    
    // Удаляем токен из localStorage
    localStorage.removeItem('access_token');
    currentUser = null;
    renderNav();
    navigateTo('home');
    showToast('success', 'Вы вышли из системы');
}

async function renderHomePage() {
    await renderFeaturedSuppliers();
    await renderNewProducts();
    await renderHomeProducts();
}

async function renderFeaturedSuppliers() {
    try {
        const suppliers = await apiRequest('/farms');
        const featuredSuppliers = suppliers.filter(s => s.featured).slice(0, 3);
        
        const suppliersHTML = featuredSuppliers.map(supplier => `
            <div class="card clickable" onclick="navigateTo('supplierDetail', '${supplier.id}')">
                <img src="${supplier.image || '/static/images/default-farm.jpg'}" alt="${supplier.name}" style="height: 200px;">
                <div class="card-content">
                    <div class="flex-between mb-2">
                        <h3 style="font-size: 1.125rem;">${supplier.name}</h3>
                        ${supplier.rating > 0 ? `
                            <div style="display: flex; align-items: center; gap: 0.25rem;">
                                <span style="color: #fbbf24;">${getIcon('star')}</span>
                                <span style="font-weight: 600; color: #92400e;">${supplier.rating}</span>
                            </div>
                        ` : ''}
                    </div>
                    <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 0.75rem;">${supplier.description.substring(0, 100)}...</p>
                    <p class="text-gray" style="font-size: 0.875rem;">${getIcon('mapPin')} ${supplier.location}</p>
                </div>
            </div>
        `).join('');
        
        document.getElementById('featuredSuppliers').innerHTML = suppliersHTML || '<p class="text-center text-gray">Нет ферм для показа</p>';
    } catch (error) {
        console.error('Ошибка при загрузке ферм:', error);
        document.getElementById('featuredSuppliers').innerHTML = '<p class="text-center text-gray">Ошибка загрузки данных</p>';
    }
}

async function renderNewProducts() {
    try {
        const products = await apiRequest('/products');
        const newProducts = [...products].reverse().slice(0, 4);
        
        const productsHTML = await Promise.all(newProducts.map(async (product) => {
            const inCartCount = await getProductInCartCount(product.id);
            return `
                <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                    <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}">
                    <div class="card-content">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="badge badge-green">${product.category}</span>
                        </div>
                        <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                        <div class="flex-between">
                            <div>
                                <span class="product-price">${product.price} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${product.unit}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn ${inCartCount > 0 ? 'btn-green' : 'btn-primary'} btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')">
                                    ${inCartCount > 0 ? `${getIcon('check')} ${inCartCount} шт` : '+ В корзину'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }));
        
        document.getElementById('newProducts').innerHTML = productsHTML.join('') || '<p class="text-center text-gray">Нет новинок</p>';
    } catch (error) {
        console.error('Ошибка при загрузке продуктов:', error);
        document.getElementById('newProducts').innerHTML = '<p class="text-center text-gray">Ошибка загрузки данных</p>';
    }
}

async function renderHomeProducts() {
    try {
        const products = await apiRequest('/products');
        const categories = await apiRequest('/categories');
        
        const categoriesList = ['Все', ...categories.map(c => c.name)];
        
        const filtersHTML = categoriesList.map(cat => 
            `<button class="category-btn ${cat === selectedCategory ? 'active' : ''}" onclick="filterCategory('${cat}', 'home')">${cat}</button>`
        ).join('');
        
        if (document.getElementById('categoryFiltersHome')) {
            document.getElementById('categoryFiltersHome').innerHTML = filtersHTML;
        }

        let filteredProducts = selectedCategory === 'Все' 
            ? products 
            : products.filter(p => p.category === selectedCategory);
        
        filteredProducts = filteredProducts.slice(0, 8);

        const productsHTML = await Promise.all(filteredProducts.map(async (product) => {
            const inCartCount = await getProductInCartCount(product.id);
            return `
                <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                    <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}">
                    <div class="card-content">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="badge badge-green">${product.category}</span>
                        </div>
                        <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">${product.description}</p>
                        <div class="flex-between">
                            <div>
                                <span class="product-price">${product.price} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${product.unit}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn ${inCartCount > 0 ? 'btn-green' : 'btn-primary'} btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')">
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
        const categories = await apiRequest('/categories');
        
        const categoriesList = ['Все', ...categories.map(c => c.name)];
        
        const filtersHTML = categoriesList.map(cat => 
            `<button class="category-btn ${cat === selectedCategory ? 'active' : ''}" onclick="filterCategory('${cat}', 'products')">${cat}</button>`
        ).join('');
        
        if (document.getElementById('categoryFilters')) {
            document.getElementById('categoryFilters').innerHTML = filtersHTML;
        }

        const filteredProducts = selectedCategory === 'Все' 
            ? products 
            : products.filter(p => p.category === selectedCategory);

        const productsHTML = await Promise.all(filteredProducts.map(async (product) => {
            const inCartCount = await getProductInCartCount(product.id);
            return `
                <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                    <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}">
                    <div class="card-content">
                        <div style="margin-bottom: 0.5rem;">
                            <span class="badge badge-green">${product.category}</span>
                        </div>
                        <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">${product.description}</p>
                        <div class="flex-between">
                            <div>
                                <span class="product-price">${product.price} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / ${product.unit}</span>
                            </div>
                            ${currentUser ? `
                                <button class="btn ${inCartCount > 0 ? 'btn-green' : 'btn-primary'} btn-small" onclick="event.stopPropagation(); addToCart('${product.id}')">
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

function filterCategory(category, page) {
    selectedCategory = category;
    if (page === 'home') {
        renderHomeProducts();
    } else {
        renderProducts();
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
            body: JSON.stringify({
                product_id: parseInt(productId),
                quantity: quantity
            })
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
        const suppliers = await apiRequest('/farms');
        
        const suppliersHTML = suppliers.map(supplier => `
            <div class="card clickable" onclick="navigateTo('supplierDetail', '${supplier.id}')">
                <img src="${supplier.image || '/static/images/default-farm.jpg'}" alt="${supplier.name}" style="height: 250px;">
                <div class="card-content">
                    <div class="flex-between mb-2">
                        <h3 style="font-size: 1.125rem;">${supplier.name}</h3>
                        ${supplier.rating > 0 ? `
                            <div style="display: flex; align-items: center; gap: 0.25rem; background: #fef3c7; padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                                <span style="color: #fbbf24;">${getIcon('star')}</span>
                                <span style="font-weight: 600; color: #92400e;">${supplier.rating}</span>
                            </div>
                        ` : ''}
                    </div>
                    <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 0.75rem;">${supplier.description}</p>
                    <p class="text-gray" style="font-size: 0.875rem; margin-bottom: 1rem;">${getIcon('mapPin')} ${supplier.location}</p>
                </div>
            </div>
        `).join('');
        
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
        const supplier = await apiRequest(`/farms/${selectedSupplierId}`);
        const products = await apiRequest('/products');
        const reviews = await apiRequest('/reviews');
        
        const supplierProducts = products.filter(p => p.supplier_id === parseInt(selectedSupplierId));
        const supplierReviews = reviews.filter(r => r.supplier_id === parseInt(selectedSupplierId));

        let html = `
            <div class="card mb-4">
                <img src="${supplier.image || '/static/images/default-farm.jpg'}" alt="${supplier.name}" style="height: 400px;">
                <div class="card-content">
                    <div class="flex-between mb-2">
                        <div>
                            <h1>${supplier.name}</h1>
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: #6b7280;">
                                ${getIcon('mapPin')}
                                <span>${supplier.location}</span>
                            </div>
                        </div>
                        ${supplier.rating > 0 ? `
                            <div style="display: flex; align-items: center; gap: 0.5rem; background: #fef3c7; padding: 0.75rem 1rem; border-radius: 0.5rem;">
                                <span style="color: #fbbf24; font-size: 1.5rem;">★</span>
                                <span style="font-size: 1.5rem;">${supplier.rating}</span>
                            </div>
                        ` : ''}
                    </div>
                    <p style="color: #374151; line-height: 1.6;">${supplier.description}</p>
                </div>
            </div>
        `;

        if (supplierProducts.length > 0) {
            html += `
                <h2 class="mb-2">Продукты от ${supplier.name}</h2>
                <div class="grid grid-4 mb-4">
                    ${supplierProducts.map(product => `
                        <div class="card" onclick="navigateTo('productDetail', '${product.id}')" style="cursor: pointer;">
                            <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}" style="height: 150px;">
                            <div class="card-content">
                                <h3 style="font-size: 1rem; margin-bottom: 0.25rem;">${product.name}</h3>
                                <p class="product-price">${product.price} ₽ <span class="text-gray" style="font-size: 0.875rem;">/ ${product.unit}</span></p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        html += `
            <div class="card">
                <div class="card-content">
                    <div class="flex-between mb-4">
                        <h2>Отзывы (${supplierReviews.length})</h2>
                        ${currentUser 
                            ? `<button class="btn btn-primary" onclick="showReviewForm()">Оставить отзыв</button>` 
                            : `<button class="btn btn-secondary" onclick="openAuthModal()">Войти, чтобы оставить отзыв</button>`
                        }
                    </div>

                    <div id="reviewFormContainer" style="display: none; background: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                        <h3 class="mb-2">Новый отзыв</h3>
                        <form onsubmit="submitReview(event)">
                            <div class="form-group">
                                <label class="form-label">Оценка</label>
                                <div class="stars" id="ratingStars" style="font-size: 2rem;">
                                    <span class="star" onclick="setRating(1)">☆</span>
                                    <span class="star" onclick="setRating(2)">☆</span>
                                    <span class="star" onclick="setRating(3)">☆</span>
                                    <span class="star" onclick="setRating(4)">☆</span>
                                    <span class="star" onclick="setRating(5)">☆</span>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Комментарий</label>
                                <textarea class="form-input" id="reviewComment" rows="4" placeholder="Поделитесь впечатлениями о продукции..." required></textarea>
                            </div>
                            <div class="flex gap-1">
                                <button type="submit" class="btn btn-primary">Отправить</button>
                                <button type="button" class="btn btn-secondary" onclick="hideReviewForm()">Отмена</button>
                            </div>
                        </form>
                    </div>

                    <div id="reviewsList">
                        ${supplierReviews.length > 0 ? supplierReviews.map(review => `
                            <div class="review-item">
                                <div class="flex-between mb-1">
                                    <div>
                                        <p style="font-weight: 600;">${review.user_name}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280;">${new Date(review.created_at).toLocaleDateString('ru-RU')}</p>
                                    </div>
                                    <div class="stars">
                                        ${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}
                                    </div>
                                </div>
                                <p style="color: #374151;">${review.comment}</p>
                            </div>
                        `).join('') : '<p class="text-center text-gray" style="padding: 2rem 0;">Пока нет отзывов. Станьте первым!</p>'}
                    </div>
                </div>
            </div>
        `;

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
    document.getElementById('reviewComment').value = '';
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
    
    const comment = document.getElementById('reviewComment').value;

    try {
        await apiRequest('/reviews', {
            method: 'POST',
            body: JSON.stringify({
                supplier_id: parseInt(selectedSupplierId),
                rating: currentRating,
                comment: comment
            })
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
        const suppliers = await apiRequest('/farms');
        
        const supplier = suppliers.find(s => s.id === product.supplier_id);
        const inCartCount = await getProductInCartCount(product.id);

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 400px; gap: 3rem; margin-top: 2rem;">
                <div>
                    <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}" class="product-main-image">
                    
                    <div class="card mb-4">
                        <div class="card-content">
                            <h2>Описание</h2>
                            <p style="color: #374151; line-height: 1.6; margin-top: 1rem;">${product.description}</p>
                            
                            <div style="margin-top: 2rem;">
                                <h3 class="mb-2">Характеристики</h3>
                                <div class="product-meta">
                                    <div class="product-meta-item">
                                        ${getIcon('package')}
                                        <span>Категория: ${product.category}</span>
                                    </div>
                                    <div class="product-meta-item">
                                        ${getIcon('store')}
                                        <span>Ферма: ${supplier?.name || 'Неизвестно'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <div class="card product-info-card">
                        <div class="card-content">
                            <div class="flex-between mb-2">
                                <h1 style="margin-bottom: 0;">${product.name}</h1>
                                ${product.rating > 0 ? `
                                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                                        <span style="color: #fbbf24;">${getIcon('star')}</span>
                                        <span style="font-weight: 600;">${product.rating}</span>
                                    </div>
                                ` : ''}
                            </div>
                            
                            <div style="margin-bottom: 0.5rem;">
                                <span class="badge badge-green">${product.category}</span>
                            </div>
                            
                            ${supplier ? `
                                <div class="flex gap-1 mb-3" style="align-items: center;">
                                    ${getIcon('store')}
                                    <span style="color: #6b7280;">
                                        Производитель: 
                                        <a href="javascript:void(0)" onclick="navigateTo('supplierDetail', '${supplier.id}')" 
                                           style="color: #16a34a; text-decoration: none;">
                                            ${supplier.name}
                                        </a>
                                    </span>
                                </div>
                            ` : ''}
                            
                            <div class="product-price" style="font-size: 2rem; margin-bottom: 1.5rem;">
                                ${product.price} ₽ <span class="text-gray" style="font-size: 1rem;">/ ${product.unit}</span>
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
                                    <input type="number" id="productQuantity" value="1" min="1" max="100">
                                    <button class="btn btn-secondary" onclick="updateProductQuantity(1)">+</button>
                                </div>
                                <button class="btn btn-primary flex-1" onclick="addToCartFromProductPage()">
                                    ${inCartCount > 0 ? 'Добавить ещё' : 'В корзину'}
                                </button>
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
    let value = parseInt(input.value) || 1;
    value = Math.max(1, value + change);
    input.value = value;
}

function addToCartFromProductPage() {
    const quantity = parseInt(document.getElementById('productQuantity').value) || 1;
    addToCart(selectedProductId, quantity);
}

async function renderSubscriptions() {
    try {
        const subscriptions = await apiRequest('/subscriptions/plans');
        
        const subscriptionsHTML = subscriptions.map(sub => {
            return `
                <div class="card">
                    <img src="${sub.image || '/static/images/default-subscription.jpg'}" alt="${sub.name}" style="height: 250px;">
                    <div class="card-content">
                        <div class="flex-between mb-2">
                            <h3>${sub.name}</h3>
                        </div>
                        <p class="text-gray mb-2">${sub.description}</p>
                        <div class="flex-between">
                            <div>
                                <span style="font-size: 1.5rem; color: #16a34a; font-weight: 700;">${sub.price} ₽</span>
                                <span class="text-gray" style="font-size: 0.875rem;"> / неделя</span>
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

        document.getElementById('subscriptionsGrid').innerHTML = subscriptionsHTML;
        document.getElementById('activeSubscriptions').innerHTML = '';
    } catch (error) {
        console.error('Ошибка при загрузке подписок:', error);
        document.getElementById('subscriptionsGrid').innerHTML = '<p class="text-center text-gray">Ошибка загрузки данных</p>';
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
        showToast('error', 'Ошибка', 'Не удалось активировать подписку');
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

        if (cartItems.length === 0) {
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
            const product = products.find(p => p.id === item.product_id);
            return sum + (product ? product.price * item.quantity : 0);
        }, 0);

        const html = `
            <div class="cart-layout" style="display: grid; grid-template-columns: 1fr 400px; gap: 2rem; margin-top: 2rem;">
                <div>
                    ${cartItems.map(item => {
                        const product = products.find(p => p.id === item.product_id);
                        if (!product) return '';
                        return `
                            <div class="cart-item">
                                <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}">
                                <div style="flex: 1;">
                                    <div class="flex-between mb-1">
                                        <div>
                                            <p style="font-weight: 600;">${product.name}</p>
                                            <p style="font-size: 0.875rem; color: #6b7280;">${product.category}</p>
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
                                            <p class="text-green" style="font-weight: 600;">${product.price * item.quantity} ₽</p>
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
                                    <span>${total} ₽</span>
                                </div>
                                <div class="flex-between mb-1">
                                    <span class="text-gray">Доставка</span>
                                    <span class="text-green">Бесплатно</span>
                                </div>
                                <div class="flex-between mt-2" style="padding-top: 0.5rem; border-top: 1px solid #e5e7eb;">
                                    <span style="font-weight: 600;">Итого</span>
                                    <span class="text-green" style="font-size: 1.5rem; font-weight: 700;">${total} ₽</span>
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
        const item = cartItems.find(i => i.product_id === parseInt(productId));
        
        if (item) {
            const newQuantity = item.quantity + change;
            if (newQuantity <= 0) {
                await removeFromCart(productId);
            } else {
                await apiRequest(`/cart/items/${productId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ quantity: newQuantity })
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
    const address = document.getElementById('deliveryAddress').value;
    const paymentMethod = document.getElementById('paymentMethod').value;

    if (!address) {
        showToast('error', 'Ошибка', 'Пожалуйста, укажите адрес доставки');
        return;
    }

    try {
        const cartItems = await apiRequest('/cart');
        
        if (cartItems.length === 0) {
            showToast('error', 'Ошибка', 'Корзина пуста');
            return;
        }

        const orderData = {
            address: address,
            payment_method: paymentMethod,
            items: cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity
            }))
        };

        await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData)
        });

        await apiRequest('/cart/clear', {
            method: 'DELETE'
        });

        renderNav();
        showToast('success', 'Заказ успешно оформлен!', 'Отслеживайте его статус в профиле.');
        navigateTo('profile');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось оформить заказ');
        console.error('Ошибка при оформлении заказа:', error);
    }
}

async function renderProfile() {
    if (!currentUser) {
        document.getElementById('profileContent').innerHTML = '<p class="text-gray">Войдите, чтобы просмотреть профиль</p>';
        return;
    }

    try {
        const userProfile = await apiRequest('/auth/me');
        const orders = await apiRequest('/orders');
        const userSubscriptions = await apiRequest('/subscriptions/user');
        const userPrizes = await apiRequest('/lottery/user/prizes');

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
                                <h2 style="margin-bottom: 0.25rem;">${userProfile.name}</h2>
                                <p class="text-gray" style="font-size: 0.875rem;">${userProfile.email}</p>
                                <span class="badge ${isAdmin() ? 'badge-green' : isSupplier() ? 'badge-blue' : 'badge-yellow'}" style="margin-top: 0.5rem;">
                                    ${isCustomer() ? 'Покупатель' : isSupplier() ? 'Поставщик' : 'Администратор'}
                                </span>
                            </div>

                            <div id="profileDetails" style="margin-bottom: 1.5rem;">
                                <div style="display: flex; gap: 0.75rem; margin-bottom: 0.75rem;">
                                    <span style="color: #9ca3af;">${getIcon('mapPin')}</span>
                                    <div>
                                        <p style="font-size: 0.875rem; color: #6b7280;">Адрес</p>
                                        <p>${userProfile.address || 'Не указан'}</p>
                                    </div>
                                </div>
                                ${userPrizes.filter(p => !p.claimed).length > 0 ? `
                                    <div style="display: flex; gap: 0.75rem; align-items: flex-start; padding-top: 0.75rem; border-top: 1px solid #e5e7eb;">
                                        <span style="color: #fbbf24;">${getIcon('gift')}</span>
                                        <div>
                                            <p style="font-size: 0.875rem; color: #6b7280;">Призы к получению</p>
                                            <p style="font-weight: 600; color: #f59e0b;">${userPrizes.filter(p => !p.claimed).length} приз(ов)</p>
                                        </div>
                                    </div>
                                ` : ''}
                            </div>

                            <button class="btn btn-primary" style="width: 100%; margin-bottom: 0.5rem;" onclick="showEditProfile()">Редактировать профиль</button>

                            <div id="editProfileForm" style="display: none; margin-top: 1rem;">
                                <form onsubmit="saveProfile(event)">
                                    <div class="form-group">
                                        <label class="form-label">Имя</label>
                                        <input type="text" class="form-input" id="editName" value="${userProfile.name}">
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label">Адрес</label>
                                        <input type="text" class="form-input" id="editAddress" value="${userProfile.address || ''}">
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
                            ${orders.filter(o => o.status === 'active').length === 0 ? 
                                '<p class="text-center text-gray" style="padding: 2rem 0;">Нет активных заказов</p>' : 
                                orders.filter(o => o.status === 'active').map(order => `
                                    <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem;">
                                        <div class="flex-between mb-2">
                                            <div>
                                                <p style="font-weight: 600;">Заказ №${order.id}</p>
                                                <p style="font-size: 0.875rem; color: #6b7280;">${new Date(order.created_at).toLocaleDateString('ru-RU')}</p>
                                            </div>
                                            <span class="badge badge-yellow">${order.status}</span>
                                        </div>
                                        <div class="flex-between">
                                            <p style="font-size: 0.875rem; color: #6b7280;">Адрес: ${order.address}</p>
                                            <p class="text-green" style="font-weight: 600;">${order.total} ₽</p>
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
    document.getElementById('profileDetails').style.display = 'none';
    const editBtn = document.querySelector('#profileContent button[onclick="showEditProfile()"]');
    if (editBtn) editBtn.style.display = 'none';
    document.getElementById('editProfileForm').style.display = 'block';
}

function hideEditProfile() {
    document.getElementById('profileDetails').style.display = 'block';
    const editBtn = document.querySelector('#profileContent button[onclick="showEditProfile()"]');
    if (editBtn) editBtn.style.display = 'block';
    document.getElementById('editProfileForm').style.display = 'none';
}

async function saveProfile(e) {
    e.preventDefault();

    const name = document.getElementById('editName').value;
    const address = document.getElementById('editAddress').value;

    try {
        await apiRequest('/auth/me', {
            method: 'PATCH',
            body: JSON.stringify({ name, address })
        });

        currentUser.name = name;
        currentUser.address = address;
        
        hideEditProfile();
        renderProfile();
        showToast('success', 'Профиль обновлен');
    } catch (error) {
        showToast('error', 'Ошибка', 'Не удалось обновить профиль');
        console.error('Ошибка при обновлении профиля:', error);
    }
}

function switchAdminTab(tab) {
    currentAdminTab = tab;
    currentAdminPage = 1;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = event.target;
    if (activeBtn) activeBtn.classList.add('active');
    
    renderAdminPanel();
}

async function renderAdminPanel() {
    if (!isAdmin()) {
        document.getElementById('adminContent').innerHTML = '<p class="text-gray">Доступ запрещен. Требуются права администратора.</p>';
        return;
    }

    let html = '';

    switch(currentAdminTab) {
        case 'dashboard':
            html = await renderAdminDashboard();
            break;
        case 'users':
            html = await renderAdminUsers();
            break;
        case 'products':
            html = await renderAdminProducts();
            break;
        case 'suppliers':
            html = await renderAdminSuppliers();
            break;
        case 'reviews':
            html = await renderAdminReviews();
            break;
        case 'orders':
            html = await renderAdminOrders();
            break;
        case 'categories':
            html = await renderAdminCategories();
            break;
    }

    document.getElementById('adminContent').innerHTML = html;
}

async function renderAdminDashboard() {
    try {
        const stats = await apiRequest('/admin/dashboard');
        
        return `
            <div class="grid grid-4 mb-4">
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Всего пользователей</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #16a34a;">${stats.total_users}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Фермы</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #3b82f6;">${stats.total_farms}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Продукты</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #f59e0b;">${stats.total_products}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Заказы</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #ef4444;">${stats.total_orders}</p>
                    </div>
                </div>
                <div class="card">
                    <div class="card-content">
                        <p class="text-gray mb-2">Отзывы</p>
                        <p style="font-size: 2.5rem; font-weight: 700; color: #8b5cf6;">${stats.total_reviews}</p>
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
        const users = response.users || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление пользователями (всего: ${total})</h2>
                    <div style="overflow-x: auto;">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Имя</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Адрес</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${users.map(user => `
                                    <tr>
                                        <td>${user.id}</td>
                                        <td>${user.name}</td>
                                        <td>${user.email}</td>
                                        <td>
                                            <select class="form-input" style="padding: 0.5rem;" onchange="updateUserRole('${user.id}', this.value)">
                                                <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Покупатель</option>
                                                <option value="farmer" ${user.role === 'farmer' ? 'selected' : ''}>Поставщик</option>
                                                <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Админ</option>
                                            </select>
                                        </td>
                                        <td style="font-size: 0.875rem; color: #6b7280;">${user.address || ''}</td>
                                        <td>
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
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function updateUserRole(userId, newRole) {
    try {
        await apiRequest(`/admin/users/${userId}/role?new_role=${newRole}`, {
            method: 'PUT'
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
        const suppliers = await apiRequest('/farms');
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление продуктами (всего: ${total})</h2>
                    <div class="grid grid-3">
                        ${products.map(product => {
                            const supplier = suppliers.find(s => s.id === product.supplier_id);
                            return `
                                <div class="card">
                                    <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}" style="height: 150px;">
                                    <div class="card-content">
                                        <p style="font-weight: 600; margin-bottom: 0.25rem;">${product.name}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${product.category}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${supplier?.name || 'Без фермы'}</p>
                                        <p class="text-green mb-2">${product.price} ₽ / ${product.unit}</p>
                                        <div class="flex gap-1">
                                            <button class="btn btn-danger btn-small flex-1" onclick="deleteProduct('${product.id}')">${getIcon('trash')}</button>
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
        const suppliers = response.farms || [];
        const total = response.total || 0;
        const totalPages = response.total_pages || 1;
        
        let html = `
            <div class="card">
                <div class="card-content">
                    <h2 class="mb-4">Управление поставщиками (всего: ${total})</h2>
                    ${suppliers.map(supplier => `
                        <div style="border: 1px solid #e5e7eb; border-radius: 0.5rem; padding: 1rem; margin-bottom: 1rem; display: flex; gap: 1rem;">
                            <img src="${supplier.image || '/static/images/default-farm.jpg'}" alt="${supplier.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 0.5rem;">
                            <div style="flex: 1;">
                                <div class="flex-between mb-1">
                                    <div>
                                        <p style="font-weight: 600;">${supplier.name}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280;">${supplier.location}</p>
                                    </div>
                                </div>
                                <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.75rem;">${supplier.description}</p>
                                <div class="flex gap-1">
                                    <button class="btn btn-danger btn-small" onclick="deleteSupplier('${supplier.id}')">${getIcon('trash')} Удалить</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
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
        console.error('Ошибка при загрузке поставщиков:', error);
        return '<p class="text-gray">Ошибка загрузки данных</p>';
    }
}

async function deleteSupplier(supplierId) {
    if (!confirm('Удалить поставщика?')) return;
    
    try {
        await apiRequest(`/admin/farms/${supplierId}`, {
            method: 'DELETE'
        });
        
        renderAdminPanel();
        showToast('success', 'Поставщик удален');
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось удалить поставщика');
        console.error('Ошибка при удалении поставщика:', error);
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
                                        <p style="font-weight: 600;">${review.user_name}</p>
                                        <p style="font-size: 0.875rem; color: #6b7280;">
                                            ${new Date(review.created_at).toLocaleDateString('ru-RU')}
                                        </p>
                                    </div>
                                    <div class="flex gap-1" style="align-items: center;">
                                        <span style="color: #fbbf24;">★ ${review.rating}</span>
                                    </div>
                                </div>
                                <p style="color: #374151; margin-bottom: 0.75rem;">${review.comment}</p>
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
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Покупатель</th>
                                    <th>Сумма</th>
                                    <th>Статус</th>
                                    <th>Дата</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orders.map(order => `
                                    <tr>
                                        <td>#${order.id}</td>
                                        <td>${order.user_name || 'Неизвестно'}</td>
                                        <td>${order.total} ₽</td>
                                        <td>${order.status}</td>
                                        <td>${new Date(order.created_at).toLocaleDateString('ru-RU')}</td>
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

async function renderAdminCategories() {
    try {
        const categories = await apiRequest(`/admin/categories`);
        
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
    document.getElementById('addCategoryForm').style.display = 'block';
}

function hideAddCategoryForm() {
    document.getElementById('addCategoryForm').style.display = 'none';
}

async function saveAdminCategory(e) {
    e.preventDefault();

    const categoryName = document.getElementById('categoryName').value;

    try {
        await apiRequest(`/admin/categories?category_name=${encodeURIComponent(categoryName)}`, {
            method: 'POST'
        });

        hideAddCategoryForm();
        document.getElementById('categoryName').value = '';
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
        await apiRequest(`/admin/categories/${categoryId}`, {
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
    try {
        const suppliers = await apiRequest('/farms');
        const supplier = suppliers.find(s => s.user_id === currentUser.id);
        
        let html = `
            <div class="card mb-4">
                <div class="card-content">
                    <div class="flex-between mb-4">
                        <h2>${getIcon('store')} Моя ферма</h2>
                        ${supplier ? `<button class="btn btn-primary" onclick="showEditSupplierPanel()">${getIcon('edit')} Редактировать</button>` : ''}
                    </div>

                    ${supplier ? `
                        <div id="supplierInfo">
                            <div class="flex gap-2 mb-4">
                                <img src="${supplier.image || '/static/images/default-farm.jpg'}" alt="${supplier.name}" style="width: 128px; height: 128px; object-fit: cover; border-radius: 0.5rem;">
                                <div style="flex: 1;">
                                    <div class="flex gap-1 mb-2" style="align-items: center;">
                                        <h3>${supplier.name}</h3>
                                    </div>
                                    <p class="text-gray mb-2">${supplier.location}</p>
                                    <p style="color: #374151;">${supplier.description}</p>
                                    ${supplier.rating > 0 ? `
                                        <p class="mt-1" style="color: #fbbf24;">★ ${supplier.rating} рейтинг</p>
                                    ` : ''}
                                </div>
                            </div>
                        </div>

                        <div id="editSupplierPanelForm" style="display: none; background: #dbeafe; padding: 1rem; border-radius: 0.5rem;">
                            <h3 class="mb-2">Редактировать информацию о ферме</h3>
                            <form onsubmit="saveSupplierPanelInfo(event)" enctype="multipart/form-data">
                                <input type="text" class="form-input mb-2" id="supplierPanelName" value="${supplier.name}" placeholder="Название фермы" required>
                                <input type="text" class="form-input mb-2" id="supplierPanelLocation" value="${supplier.location}" placeholder="Местоположение" required>
                                <textarea class="form-input mb-2" id="supplierPanelDescription" rows="4" required>${supplier.description}</textarea>
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
                                <input type="text" class="form-input mb-2" id="newSupplierLocation" placeholder="Местоположение" required>
                                <textarea class="form-input mb-2" id="newSupplierDescription" rows="4" placeholder="Описание фермы" required></textarea>
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

        if (supplier && supplier.approved) {
            const products = await apiRequest('/products');
            const supplierProducts = products.filter(p => p.supplier_id === supplier.id);
            
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
                                    <input type="number" class="form-input" id="supplierProductPrice" placeholder="Цена" required>
                                    <input type="text" class="form-input" id="supplierProductUnit" placeholder="Единица (кг, л, шт)" required>
                                    <input type="text" class="form-input" id="supplierProductCategory" placeholder="Категория" required>
                                    <input type="file" class="form-input" id="supplierProductImage" accept="image/*" style="grid-column: 1 / -1;">
                                    <textarea class="form-input" id="supplierProductDescription" placeholder="Описание" style="grid-column: 1 / -1;"></textarea>
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
                                        <img src="${product.image || '/static/images/default-product.jpg'}" alt="${product.name}" style="height: 150px;">
                                        <div class="card-content">
                                            <div class="flex-between mb-1">
                                                <div>
                                                    <p style="font-weight: 600; margin-bottom: 0.25rem;">${product.name}</p>
                                                    <p style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.5rem;">${product.category}</p>
                                                </div>
                                                <div class="flex gap-1">
                                                    <button class="btn btn-danger btn-small" onclick="deleteSupplierProduct('${product.id}')">${getIcon('trash')}</button>
                                                </div>
                                            </div>
                                            <p class="text-green mb-2">${product.price} ₽ / ${product.unit}</p>
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
    document.getElementById('createSupplierForm').style.display = 'block';
}

function hideCreateSupplier() {
    document.getElementById('createSupplierForm').style.display = 'none';
}

async function createSupplier(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('newSupplierName').value);
    formData.append('location', document.getElementById('newSupplierLocation').value);
    formData.append('description', document.getElementById('newSupplierDescription').value);
    
    const imageInput = document.getElementById('newSupplierImage');
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        await fetch(`${API_BASE_URL}/farms/applications`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });

        showToast('success', 'Заявка отправлена', 'Заявка на регистрацию фермы отправлена администратору');
        hideCreateSupplier();
        renderSupplierPanel();
    } catch (error) {
        showToast('error', 'Ошибка', error.message || 'Не удалось отправить заявку');
        console.error('Ошибка при отправке заявки:', error);
    }
}

function showEditSupplierPanel() {
    document.getElementById('supplierInfo').style.display = 'none';
    document.getElementById('editSupplierPanelForm').style.display = 'block';
}

function hideEditSupplierPanel() {
    document.getElementById('supplierInfo').style.display = 'block';
    document.getElementById('editSupplierPanelForm').style.display = 'none';
}

async function saveSupplierPanelInfo(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('supplierPanelName').value);
    formData.append('location', document.getElementById('supplierPanelLocation').value);
    formData.append('description', document.getElementById('supplierPanelDescription').value);
    
    const imageInput = document.getElementById('supplierPanelImage');
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const suppliers = await apiRequest('/farms');
        const supplier = suppliers.find(s => s.user_id === currentUser.id);
        
        if (supplier) {
            await fetch(`${API_BASE_URL}/farms/${supplier.id}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include'
            });
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
    document.getElementById('addSupplierProductForm').style.display = 'block';
}

function hideAddSupplierProduct() {
    document.getElementById('addSupplierProductForm').style.display = 'none';
}

async function saveSupplierProduct(e) {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', document.getElementById('supplierProductName').value);
    formData.append('price', document.getElementById('supplierProductPrice').value);
    formData.append('unit', document.getElementById('supplierProductUnit').value);
    formData.append('category', document.getElementById('supplierProductCategory').value);
    formData.append('description', document.getElementById('supplierProductDescription').value);
    
    const imageInput = document.getElementById('supplierProductImage');
    if (imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const suppliers = await apiRequest('/farms');
        const supplier = suppliers.find(s => s.user_id === currentUser.id);
        
        if (supplier) {
            formData.append('supplier_id', supplier.id);
            
            await fetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });
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

document.addEventListener('DOMContentLoaded', function() {
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;
            const errorDiv = document.getElementById('authError');
            
            try {
                let response;
                
                if (authMode === 'register') {
                    const name = document.getElementById('authName').value;
                    const address = document.getElementById('authAddress').value;
                    
                    if (!email || !password || !name || !address) {
                        errorDiv.textContent = 'Пожалуйста, заполните все поля';
                        errorDiv.style.display = 'block';
                        return;
                    }
 
                    response = await fetch(`${API_BASE_URL}/auth/register`, {
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
                    
                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}));
                        if (Array.isArray(error.detail)) {
                            errorDiv.textContent = error.detail.map(err => err.msg || err.detail || 'Ошибка регистрации').join(', ');
                        } else if (typeof error.detail === 'object' && error.detail !== null) {
                            errorDiv.textContent = error.detail.msg || error.detail.message || error.detail || 'Ошибка регистрации: ' + response.statusText;
                        } else {
                            errorDiv.textContent = error.detail || 'Ошибка регистрации: ' + response.statusText;
                        }
                        errorDiv.style.display = 'block';
                        return;
                    }
                }
 
                response = await fetch(`${API_BASE_URL}/auth/login`, {
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
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
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
                }
                
                closeAuthModal();
                renderNav();
                navigateTo('home');
                showToast('success', 'Добро пожаловать!');
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

    checkAuth();

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

    renderNav();
    renderHomePage();

    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    }
});