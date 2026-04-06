// ====================
// VERİ TABANASI YÖNETİMİ
// ====================

class Database {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        if (!localStorage.getItem('restaurants')) {
            localStorage.setItem('restaurants', JSON.stringify([]));
        }
        if (!localStorage.getItem('foods')) {
            localStorage.setItem('foods', JSON.stringify([]));
        }
        if (!localStorage.getItem('orders')) {
            localStorage.setItem('orders', JSON.stringify([]));
        }
    }

    // Restoranlar (Dükkânlar)
    getRestaurants() {
        return JSON.parse(localStorage.getItem('restaurants') || '[]');
    }

    addRestaurant(ownerId, name, desc, phone) {
        const restaurants = this.getRestaurants();
        const restaurant = {
            id: Date.now(),
            ownerId,
            name,
            desc,
            phone,
            createdAt: new Date().toLocaleString('tr-TR')
        };
        restaurants.push(restaurant);
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
        return restaurant;
    }

    getRestaurantsByOwner(ownerId) {
        return this.getRestaurants().filter(r => r.ownerId === ownerId);
    }

    getRestaurantById(id) {
        return this.getRestaurants().find(r => r.id == id);
    }

    updateRestaurant(id, name, desc, phone) {
        let restaurants = this.getRestaurants();
        restaurants = restaurants.map(r => 
            r.id == id ? { ...r, name, desc, phone } : r
        );
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
    }

    deleteRestaurant(id) {
        let restaurants = this.getRestaurants();
        restaurants = restaurants.filter(r => r.id != id);
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
        
        let foods = this.getFoods();
        foods = foods.filter(f => f.restaurantId != id);
        localStorage.setItem('foods', JSON.stringify(foods));
    }

    // Yemekler
    getFoods() {
        return JSON.parse(localStorage.getItem('foods') || '[]');
    }

    getFoodsByRestaurant(restaurantId) {
        return this.getFoods().filter(f => f.restaurantId == restaurantId);
    }

    addFood(restaurantId, name, desc, price) {
        const foods = this.getFoods();
        const food = {
            id: Date.now(),
            restaurantId: parseInt(restaurantId),
            name,
            desc,
            price: parseFloat(price)
        };
        foods.push(food);
        localStorage.setItem('foods', JSON.stringify(foods));
        return food;
    }

    updateFood(id, name, desc, price) {
        let foods = this.getFoods();
        foods = foods.map(f => 
            f.id == id ? { ...f, name, desc, price: parseFloat(price) } : f
        );
        localStorage.setItem('foods', JSON.stringify(foods));
    }

    deleteFood(id) {
        let foods = this.getFoods();
        foods = foods.filter(f => f.id != id);
        localStorage.setItem('foods', JSON.stringify(foods));
    }

    // Siparişler
    getOrders() {
        return JSON.parse(localStorage.getItem('orders') || '[]');
    }

    addOrder(restaurantId, items, total, userPhone, userId) {
        const orders = this.getOrders();
        const order = {
            id: 'SIP-' + Date.now(),
            restaurantId: parseInt(restaurantId),
            items,
            total: parseFloat(total),
            userPhone,
            status: 'Bekleme',
            createdAt: new Date().toLocaleString('tr-TR'),
            userId
        };
        orders.push(order);
        localStorage.setItem('orders', JSON.stringify(orders));
        return order;
    }

    updateOrderStatus(orderId, status) {
        let orders = this.getOrders();
        orders = orders.map(o => 
            o.id === orderId ? { ...o, status } : o
        );
        localStorage.setItem('orders', JSON.stringify(orders));
    }

    getOrdersByRestaurant(restaurantId) {
        return this.getOrders().filter(o => o.restaurantId === restaurantId);
    }

    getOrdersByUser(userId) {
        return this.getOrders().filter(o => o.userId === userId);
    }

    // Kullanıcı
    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser') || '{}');
    }

    updateUser(userData) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === userData.id);
        if (index !== -1) {
            users[index] = userData;
            localStorage.setItem('users', JSON.stringify(users));
        }
    }
}

// ====================
// UYGULAMA MANTIGI
// ====================

const db = new Database();
let currentCart = [];
let editingFood = null;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    setupEventListeners();
    checkUserType();
    renderCustomerView();
});

function setupEventListeners() {
    document.getElementById('customerBtn').addEventListener('click', switchToCustomer);
    document.getElementById('shopBtn').addEventListener('click', switchToShop);
    document.getElementById('adminBtn').addEventListener('click', switchToAdmin);
    document.getElementById('openShopBtn').addEventListener('click', openShopModal);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    document.querySelectorAll('.customer-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchCustomerTab);
    });

    document.querySelectorAll('#shopPanel .tab-btn').forEach(btn => {
        btn.addEventListener('click', switchShopTab);
    });

    document.querySelectorAll('#adminPanel .tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAdminTab);
    });

    document.getElementById('restaurantForm').addEventListener('submit', handleRestaurantSubmit);
    document.getElementById('foodForm').addEventListener('submit', handleFoodSubmit);
    document.getElementById('searchRestaurant').addEventListener('input', filterRestaurants);
    document.getElementById('checkoutBtn').addEventListener('click', checkout);
    document.querySelector('.close')?.addEventListener('click', closeModal);
}

function checkUserType() {
    const user = db.getCurrentUser();
    const userRole = localStorage.getItem('userRole');
    displayUserInfo();
    
    const shopBtn = document.getElementById('shopBtn');
    const openShopBtn = document.getElementById('openShopBtn');
    const adminBtn = document.getElementById('adminBtn');
    
    if (userRole === 'admin') {
        adminBtn.style.display = 'inline-block';
        shopBtn.style.display = 'none';
        openShopBtn.style.display = 'none';
        switchToAdmin();
    } else if (user.isShopOwner && user.shopData) {
        shopBtn.style.display = 'inline-block';
        openShopBtn.style.display = 'none';
        adminBtn.style.display = 'none';
    } else {
        shopBtn.style.display = 'none';
        openShopBtn.style.display = 'inline-block';
        adminBtn.style.display = 'none';
    }
}

function displayUserInfo() {
    const user = db.getCurrentUser();
    const userRole = localStorage.getItem('userRole');
    const userDisplay = document.getElementById('userDisplay');
    
    if (userRole === 'admin') {
        userDisplay.textContent = '👨‍💼 ' + user.name;
    } else {
        userDisplay.textContent = '👤 ' + user.name;
    }
}

function handleLogout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}

// ====================
// DÜKKAN AÇMA MODAL
// ====================

function openShopModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <span class="close">&times;</span>
            
            <h2 style="color: #667eea; margin-bottom: 20px;">🏪 Dükkan Açmak İçin Sözleşme</h2>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; font-size: 13px; line-height: 1.8; color: #555;">
                <h3>📋 DÜKKAN ACKETKESİ VE KULLANIM ŞARTLARI</h3>
                
                <p><strong>1. GENEL HÜKÜMLER</strong></p>
                <p>Bu sözleşme, Yemek Sepeti platformu üzerinde dükkan açmak isteyen kişiler ("Dükkan Sahibi") ile platform işletmecisi ("Platform") arasında yapılan anlaşmadır.</p>
                
                <p><strong>2. DÜKKAN SAHİBİNİN SORUMLULUKLARI</strong></p>
                <p>• Dükkan Sahibi, sağladığı tüm bilgilerin doğru ve güncel olmasından sorumludur.<br>
                • Dükkan Sahibi, satışını yaptığı ürünlerin adil fiyatlandırılması ve kalitesinden sorumludur.<br>
                • Dükkan Sahibi, Türk yasaları ve Platform kurallarına uymalıdır.<br>
                • Dükkan Sahibi, müşteri şikayetlerine makul sürede yanıt vermekle yükümlüdür.</p>
                
                <p><strong>3. PLATFORM HAKLARI</strong></p>
                <p>• Platform, hiçbir gerekçe göstermeksizin düşük kaliteli hizmet sunan dükkânları kapatabilir.<br>
                • Platform, sistemin kötüye kullanılması durumunda gerekli önlemleri alabilir.</p>
                
                <p><strong>4. ÖDEME VE KOMİSYON</strong></p>
                <p>• Dükkan Sahibi, Platform tarafından belirlenen komisyon oranlarına razı olmakla sözleşmeyi kabul etmiş sayılır.<br>
                • Ödemeler aylık olarak yapılır.</p>
                
                <p><strong>5. SONLANDIRMA</strong></p>
                <p>• Her iki taraf da 30 gün haber vererek sözleşmeyi sonlandırabilir.<br>
                • Platform, kural ihlalleri durumunda sözleşmeyi derhal sonlandırabilir.</p>
                
                <p><strong>Lütfen bu sözleşmeyi dikkatli şekilde okuyup kabul ettiğiniz takdirde, dükkânınızı açabilirsiniz.</strong></p>
            </div>
            
            <div id="shopFormSection" style="display: none;">
                <h3>Dükkan Bilgileri</h3>
                <form id="modalShopForm" style="display: flex; flex-direction: column; gap: 15px;">
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">Dükkan Adı</label>
                        <input type="text" id="modalShopName" placeholder="Dükkânınızın adı" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">Dükkan Açıklaması</label>
                        <textarea id="modalShopDesc" placeholder="Ne tür yemekler sunuyorsunuz?" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; font-family: inherit; height: 80px;"></textarea>
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">Dükkan Telefonu</label>
                        <input type="tel" id="modalShopPhone" placeholder="5XX XXX XXXX" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">Vergi Kimlik Numarası</label>
                        <input type="text" id="modalShopTIN" placeholder="VKN" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <div>
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">İşletme Ruhsatı Tarihi</label>
                        <input type="date" id="modalShopLicenseDate" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
                    </div>
                    
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 13px;">
                        <input type="checkbox" id="agreeCheckbox" required>
                        <span>✅ Yukarıdaki şartları okudum ve kabul ediyorum</span>
                    </label>
                    
                    <button type="submit" class="btn btn-success" style="width: 100%;">🏪 Dükkan Aç!</button>
                </form>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="agreeBtn" class="btn btn-primary" style="flex: 1;">✅ Sözleşmeyi Okudum, Devam Et</button>
                <button id="disagreeBtn" class="btn btn-danger" style="flex: 1;">❌ Pişman Oldum</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    const agreeBtn = modal.querySelector('#agreeBtn');
    const disagreeBtn = modal.querySelector('#disagreeBtn');
    const formSection = modal.querySelector('#shopFormSection');
    const form = modal.querySelector('#modalShopForm');
    
    agreeBtn.addEventListener('click', () => {
        agreeBtn.style.display = 'none';
        disagreeBtn.style.display = 'none';
        formSection.style.display = 'block';
    });
    
    disagreeBtn.addEventListener('click', () => {
        modal.remove();
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        createShop(modal);
    });
}

function createShop(modal) {
    const name = modal.querySelector('#modalShopName').value;
    const desc = modal.querySelector('#modalShopDesc').value;
    const phone = modal.querySelector('#modalShopPhone').value;
    const tin = modal.querySelector('#modalShopTIN').value;
    const licenseDate = modal.querySelector('#modalShopLicenseDate').value;
    
    if (!name || !desc || !phone || !tin || !licenseDate) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }
    
    const user = db.getCurrentUser();
    const shopData = {
        name,
        desc,
        phone,
        tin,
        licenseDate,
        createdAt: new Date().toLocaleString('tr-TR')
    };
    
    user.isShopOwner = true;
    user.shopData = shopData;
    
    db.updateUser(user);
    db.addRestaurant(user.id, name, desc, phone);
    
    alert('✅ Dükkanınız açıldı! Yönetim paneline geçiliyor...');
    modal.remove();
    
    checkUserType();
    switchToShop();
}

// ====================
// MÜŞTERİ ARAYÜZÜ
// ====================

function switchToCustomer() {
    document.getElementById('customerPanel').classList.add('active');
    document.getElementById('shopPanel').classList.remove('active');
    document.getElementById('customerBtn').classList.add('active');
    document.getElementById('shopBtn').classList.remove('active');
    renderCustomerView();
}

function switchCustomerTab(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.customer-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.customer-tab-content').forEach(tab => tab.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'orders-tab') renderMyOrders();
    if (tabName === 'profile-tab') renderProfile();
}

function renderCustomerView() {
    renderRestaurants();
}

function renderRestaurants() {
    const restaurants = db.getRestaurants();
    const html = restaurants.map(r => `
        <div class="restaurant-card" onclick="viewRestaurant(${r.id})">
            <h3>🍽️ ${r.name}</h3>
            <p>${r.desc || 'Açıklama yok'}</p>
            <p class="phone">📞 ${r.phone}</p>
        </div>
    `).join('');
    
    document.getElementById('restaurantList').innerHTML = html || '<p>Henüz restorant eklenmedi</p>';
}

function filterRestaurants() {
    const searchTerm = document.getElementById('searchRestaurant').value.toLowerCase();
    const restaurants = db.getRestaurants();
    const filtered = restaurants.filter(r => r.name.toLowerCase().includes(searchTerm));
    
    const html = filtered.map(r => `
        <div class="restaurant-card" onclick="viewRestaurant(${r.id})">
            <h3>🍽️ ${r.name}</h3>
            <p>${r.desc || 'Açıklama yok'}</p>
            <p class="phone">📞 ${r.phone}</p>
        </div>
    `).join('');
    
    document.getElementById('restaurantList').innerHTML = html || '<p>Restorant bulunamadı</p>';
}

function viewRestaurant(restaurantId) {
    const restaurant = db.getRestaurantById(restaurantId);
    const foods = db.getFoodsByRestaurant(restaurantId);
    
    let html = `
        <div class="detail-header">
            <h2>${restaurant.name}</h2>
            <p>${restaurant.desc}</p>
            <p>📞 ${restaurant.phone}</p>
        </div>
        <div class="foods-list">
    `;
    
    if (foods.length > 0) {
        html += foods.map(f => `
            <div class="food-item">
                <h4>${f.name}</h4>
                <p class="description">${f.desc}</p>
                <div class="food-item-footer">
                    <span class="food-price">₺${f.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${f.id}, '${f.name}', ${f.price}, '${restaurant.name}', ${restaurantId})">Sepete Ekle</button>
                </div>
            </div>
        `).join('');
    } else {
        html += '<p>Bu restoranın henüz yemeği yok</p>';
    }
    
    html += '</div>';
    
    document.getElementById('detailContent').innerHTML = html;
    document.getElementById('restaurantDetail').style.display = 'block';
}

function closeModal() {
    document.getElementById('restaurantDetail').style.display = 'none';
}

function addToCart(foodId, foodName, price, restaurantName, restaurantId) {
    const item = currentCart.find(i => i.foodId == foodId);
    
    if (item) {
        item.quantity += 1;
    } else {
        currentCart.push({
            foodId,
            foodName,
            price,
            restaurantName,
            restaurantId,
            quantity: 1
        });
    }
    
    updateCart();
    closeModal();
}

function updateCart() {
    const cartItemsHtml = currentCart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.foodName}</div>
                <div class="cart-item-price">₺${item.price.toFixed(2)} x${item.quantity}</div>
            </div>
            <button class="cart-item-remove" onclick="removeFromCart(${index})">Sil</button>
        </div>
    `).join('');
    
    document.getElementById('cartItems').innerHTML = cartItemsHtml || '<p>Sepetiniz boş</p>';
    
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = total.toFixed(2);
    
    document.getElementById('checkoutBtn').disabled = currentCart.length === 0;
}

function removeFromCart(index) {
    currentCart.splice(index, 1);
    updateCart();
}

function checkout() {
    if (currentCart.length === 0) return;
    
    const user = db.getCurrentUser();
    if (!user.phone) {
        alert('Lütfen profilinize telefon numarası ekleyin!');
        return;
    }
    
    const restaurants = [...new Set(currentCart.map(i => i.restaurantId))];
    if (restaurants.length > 1) {
        alert('Farklı restorantlardan aynı anda sipariş veremezsiniz. Lütfen bir restoranttan sipariş verin.');
        return;
    }
    
    const restaurantId = currentCart[0].restaurantId;
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const items = currentCart.map(i => `${i.foodName} x${i.quantity}`).join(', ');
    
    db.addOrder(restaurantId, items, total, user.phone, user.id);
    
    alert('✅ Siparişiniz alındı! Sipariş ID: ' + db.getOrders()[db.getOrders().length - 1].id);
    currentCart = [];
    updateCart();
}

function renderMyOrders() {
    const user = db.getCurrentUser();
    const orders = db.getOrdersByUser(user.id);
    
    if (orders.length === 0) {
        document.getElementById('myOrdersList').innerHTML = '<p>Henüz siparişiniz yok</p>';
        return;
    }
    
    const restaurants = db.getRestaurants();
    const html = orders.map(order => {
        const restaurant = restaurants.find(r => r.id == order.restaurantId);
        const statusClass = order.status === 'Bekleme' ? 'status-pending' : order.status === 'Onaylandı' ? 'status-confirmed' : 'status-delivered';
        
        return `
            <div class="order-card">
                <h3>${order.id}</h3>
                <div class="order-details">
                    <p><strong>Restorant:</strong> ${restaurant?.name || 'Bilinmiyor'}</p>
                    <p><strong>Tarih:</strong> ${order.createdAt}</p>
                </div>
                <div class="order-items"><strong>Ürünler:</strong> ${order.items}</div>
                <p><strong>Toplam:</strong> ₺${order.total.toFixed(2)}</p>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('myOrdersList').innerHTML = html;
}

function renderProfile() {
    const user = db.getCurrentUser();
    
    const html = `
        <div class="profile-card">
            <div class="profile-field">
                <label>İsim / Ad Soyad</label>
                <input type="text" id="profileName" value="${user.name}" placeholder="Ad Soyad">
            </div>
            <div class="profile-field">
                <label>Telefon Numarası</label>
                <input type="tel" id="profilePhone" value="${user.phone || ''}" placeholder="5XX XXX XXXX">
            </div>
            <div class="profile-field">
                <label>Email</label>
                <input type="email" id="profileEmail" value="${user.email}" placeholder="ornek@email.com">
            </div>
            <div class="profile-actions">
                <button class="btn btn-primary" onclick="saveProfile()">Kaydet</button>
            </div>
        </div>
    `;
    
    document.getElementById('profileContent').innerHTML = html;
}

function saveProfile() {
    const user = db.getCurrentUser();
    const name = document.getElementById('profileName').value || user.name;
    const phone = document.getElementById('profilePhone').value;
    const email = document.getElementById('profileEmail').value;
    
    user.name = name;
    user.phone = phone;
    user.email = email;
    
    db.updateUser(user);
    displayUserInfo();
    alert('✅ Profiliniz güncellendi!');
}

// ====================
// DÜKKAN SAHİBİ ARAYÜZÜ
// ====================

function switchToShop() {
    document.getElementById('shopPanel').classList.add('active');
    document.getElementById('customerPanel').classList.remove('active');
    document.getElementById('shopBtn').classList.add('active');
    document.getElementById('customerBtn').classList.remove('active');
    renderShopView();
}

// ====================
// ADMİN ARAYÜZÜ
// ====================

function switchToAdmin() {
    document.getElementById('adminPanel').classList.add('active');
    document.getElementById('customerPanel').classList.remove('active');
    document.getElementById('shopPanel').classList.remove('active');
    document.getElementById('adminBtn').classList.add('active');
    document.getElementById('customerBtn').classList.remove('active');
    document.getElementById('shopBtn').classList.remove('active');
    renderAdminView();
}

function switchAdminTab(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('#adminPanel .tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('#adminPanel .tab-content').forEach(tab => tab.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'admin-dashboard') renderAdminDashboard();
    if (tabName === 'admin-shops') renderAdminShops();
    if (tabName === 'admin-foods') renderAdminFoods();
    if (tabName === 'admin-orders') renderAdminOrders();
    if (tabName === 'admin-users') renderAdminUsers();
}

function renderAdminView() {
    renderAdminDashboard();
}

function renderAdminDashboard() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const restaurants = db.getRestaurants();
    const foods = db.getFoods();
    const orders = db.getOrders();
    
    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalShops').textContent = restaurants.length;
    document.getElementById('totalFoods').textContent = foods.length;
    document.getElementById('totalOrders').textContent = orders.length;
}

function renderAdminShops() {
    const restaurants = db.getRestaurants();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const html = restaurants.map(r => {
        const owner = users.find(u => u.id === r.ownerId);
        return `
            <tr>
                <td><strong>${r.name}</strong></td>
                <td>${owner?.name || 'Bilinmiyor'}</td>
                <td>${r.phone}</td>
                <td>${r.createdAt}</td>
                <td>
                    <button class="btn btn-danger" onclick="adminDeleteShop(${r.id})">Sil</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('adminShopsTableBody').innerHTML = html || '<tr><td colspan="5" style="text-align: center;">Dükkân yok</td></tr>';
}

function renderAdminFoods() {
    const foods = db.getFoods();
    const restaurants = db.getRestaurants();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const html = foods.map(f => {
        const restaurant = restaurants.find(r => r.id === f.restaurantId);
        const owner = users.find(u => u.id === restaurant?.ownerId);
        return `
            <tr>
                <td>${f.name}</td>
                <td>${restaurant?.name || 'Bilinmiyor'}</td>
                <td>₺${f.price.toFixed(2)}</td>
                <td>${owner?.name || 'Bilinmiyor'}</td>
                <td>
                    <button class="btn btn-danger" onclick="adminDeleteFood(${f.id})">Sil</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('adminFoodsTableBody').innerHTML = html || '<tr><td colspan="5" style="text-align: center;">Yemek yok</td></tr>';
}

function renderAdminOrders() {
    const orders = db.getOrders();
    const restaurants = db.getRestaurants();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const html = orders.map(o => {
        const restaurant = restaurants.find(r => r.id === o.restaurantId);
        const user = users.find(u => u.id === o.userId);
        return `
            <tr>
                <td>${o.id}</td>
                <td>${user?.name || 'Bilinmiyor'}</td>
                <td>${restaurant?.name || 'Bilinmiyor'}</td>
                <td>${o.items}</td>
                <td>₺${o.total.toFixed(2)}</td>
                <td>${o.status}</td>
                <td>${o.createdAt}</td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('adminOrdersTableBody').innerHTML = html || '<tr><td colspan="7" style="text-align: center;">Sipariş yok</td></tr>';
}

function renderAdminUsers() {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const html = users.map(u => {
        const isShopOwner = u.isShopOwner ? '✅ Evet' : '❌ Hayır';
        return `
            <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td>${isShopOwner}</td>
                <td>${u.createdAt}</td>
                <td>
                    <button class="btn btn-danger" onclick="adminDeleteUser(${u.id})">Sil</button>
                </td>
            </tr>
        `;
    }).join('');
    
    document.getElementById('adminUsersTableBody').innerHTML = html || '<tr><td colspan="6" style="text-align: center;">Kullanıcı yok</td></tr>';
}

function adminDeleteShop(shopId) {
    if (confirm('Bu dükkanı silmek istediğinizden emin misiniz? Tüm yemekleri ve siparişleri de silinecek!')) {
        db.deleteRestaurant(shopId);
        alert('✅ Dükkân silindi!');
        renderAdminShops();
    }
}

function adminDeleteFood(foodId) {
    if (confirm('Bu yemeği silmek istediğinizden emin misiniz?')) {
        db.deleteFood(foodId);
        alert('✅ Yemek silindi!');
        renderAdminFoods();
    }
}

function adminDeleteUser(userId) {
    if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz? İlgili tüm siparişler de silinecek!')) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = users.filter(u => u.id !== userId);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
        
        // Kullanıcının dükkanını sil
        let restaurants = db.getRestaurants();
        const userShops = restaurants.filter(r => r.ownerId === userId);
        userShops.forEach(shop => db.deleteRestaurant(shop.id));
        
        alert('✅ Kullanıcı ve ilgili veriler silindi!');
        renderAdminUsers();
    }
}

function switchShopTab(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'restaurants-tab') {
        renderMyShopInfo();
    } else if (tabName === 'foods-tab') {
        renderFoodTable();
    } else if (tabName === 'orders-tab') {
        renderOrderTable();
    }
}

function renderShopView() {
    renderMyShopInfo();
}

function renderMyShopInfo() {
    const user = db.getCurrentUser();
    const shops = db.getRestaurantsByOwner(user.id);
    const shop = shops[0];
    
    if (!shop) {
        document.getElementById('myShopInfo').innerHTML = '<p>Dükkân bulunamadı</p>';
        return;
    }
    
    const html = `
        <h3>📍 Mevcut Dükkân Bilgileri</h3>
        <p><strong>Adı:</strong> ${shop.name}</p>
        <p><strong>Açıklaması:</strong> ${shop.desc}</p>
        <p><strong>Telefon:</strong> ${shop.phone}</p>
        <p><strong>Açılış Tarihi:</strong> ${shop.createdAt}</p>
    `;
    
    document.getElementById('myShopInfo').innerHTML = html;
    
    document.getElementById('restaurantForm').style.display = 'none';
    renderFoodTable();
}

function renderFoodTable() {
    const user = db.getCurrentUser();
    const shops = db.getRestaurantsByOwner(user.id);
    
    if (shops.length === 0) {
        document.getElementById('foodTableBody').innerHTML = '<tr><td colspan="4">Dükkân bulunamadı</td></tr>';
        return;
    }
    
    const shop = shops[0];
    const foods = db.getFoodsByRestaurant(shop.id);
    
    const html = foods.map(f => `
        <tr>
            <td>${f.name}</td>
            <td>${f.desc || '-'}</td>
            <td>₺${f.price.toFixed(2)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editFood(${f.id})">Düzenle</button>
                    <button class="btn btn-danger" onclick="deleteFoodClick(${f.id})">Sil</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('foodTableBody').innerHTML = html || '<tr><td colspan="4">Yemek yok</td></tr>';
}

function handleRestaurantSubmit(e) {
    e.preventDefault();
    const user = db.getCurrentUser();
    const name = document.getElementById('restaurantName').value;
    const desc = document.getElementById('restaurantDesc').value;
    const phone = document.getElementById('restaurantPhone').value;
    
    const shops = db.getRestaurantsByOwner(user.id);
    if (shops.length > 0) {
        db.updateRestaurant(shops[0].id, name, desc, phone);
        alert('✅ Dükkan bilgileri güncellendi!');
    }
    
    renderMyShopInfo();
}

function handleFoodSubmit(e) {
    e.preventDefault();
    const user = db.getCurrentUser();
    const shops = db.getRestaurantsByOwner(user.id);
    
    if (shops.length === 0) {
        alert('Dükkân bulunamadı!');
        return;
    }
    
    const restaurantId = shops[0].id;
    const id = document.getElementById('foodId').value;
    const name = document.getElementById('foodName').value;
    const desc = document.getElementById('foodDesc').value;
    const price = document.getElementById('foodPrice').value;
    
    if (id) {
        db.updateFood(parseInt(id), name, desc, price);
        alert('✅ Yemek güncellendi!');
    } else {
        db.addFood(restaurantId, name, desc, price);
        alert('✅ Yemek eklendi!');
    }
    
    e.target.reset();
    document.getElementById('foodId').value = '';
    document.getElementById('cancelFoodEditBtn').style.display = 'none';
    renderFoodTable();
}

function editFood(id) {
    const foods = db.getFoods();
    const food = foods.find(f => f.id == id);
    
    document.getElementById('foodId').value = id;
    document.getElementById('foodName').value = food.name;
    document.getElementById('foodDesc').value = food.desc;
    document.getElementById('foodPrice').value = food.price;
    document.getElementById('cancelFoodEditBtn').style.display = 'inline-block';
    
    document.getElementById('foodForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelFoodEdit() {
    document.getElementById('foodForm').reset();
    document.getElementById('foodId').value = '';
    document.getElementById('cancelFoodEditBtn').style.display = 'none';
}

function deleteFoodClick(id) {
    if (confirm('Bu yemeği silmek istediğinizden emin misiniz?')) {
        db.deleteFood(id);
        alert('✅ Yemek silindi!');
        renderFoodTable();
    }
}

function renderOrderTable() {
    const user = db.getCurrentUser();
    const shops = db.getRestaurantsByOwner(user.id);
    
    if (shops.length === 0) {
        document.getElementById('ordersTableBody').innerHTML = '<tr><td colspan="6">Dükkân bulunamadı</td></tr>';
        return;
    }
    
    const shop = shops[0];
    const orders = db.getOrdersByRestaurant(shop.id);
    
    const html = orders.map(o => `
        <tr>
            <td>${o.id}</td>
            <td>${o.userPhone}</td>
            <td>${o.items}</td>
            <td>₺${o.total.toFixed(2)}</td>
            <td>
                <select onchange="updateOrderStatus('${o.id}', this.value)">
                    <option value="Bekleme" ${o.status === 'Bekleme' ? 'selected' : ''}>Bekleme</option>
                    <option value="Onaylandı" ${o.status === 'Onaylandı' ? 'selected' : ''}>Onaylandı</option>
                    <option value="Teslim Edildi" ${o.status === 'Teslim Edildi' ? 'selected' : ''}>Teslim Edildi</option>
                </select>
            </td>
            <td>${o.createdAt}</td>
        </tr>
    `).join('');
    
    document.getElementById('ordersTableBody').innerHTML = html || '<tr><td colspan="6">Sipariş yok</td></tr>';
}

function updateOrderStatus(orderId, status) {
    db.updateOrderStatus(orderId, status);
    alert('✅ Sipariş durumu güncellendi!');
    renderOrderTable();
}
