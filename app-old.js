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
        
        // Dükkan silince yemeklerini de sil
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

    updateFood(id, name, desc, price, restaurantId) {
        let foods = this.getFoods();
        foods = foods.map(f => 
            f.id == id ? { ...f, name, desc, price: parseFloat(price), restaurantId: parseInt(restaurantId) } : f
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
        // Tüm users listesini de update et
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
let editingRestaurant = null;
let editingFood = null;

// Sayfanın yüklenmesi
document.addEventListener('DOMContentLoaded', () => {
    // Giriş kontrolü
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    setupEventListeners();
    checkUserType();
    renderCustomerView();
});

// Kullanıcı türünü kontrol et
function checkUserType() {
    const user = db.getCurrentUser();
    displayUserInfo();
    
    // Dükkan paneli kontrol et
    const shopBtn = document.getElementById('shopBtn');
    const openShopBtn = document.getElementById('openShopBtn');
    
    if (user.isShopOwner) {
        shopBtn.style.display = 'inline-block';
        openShopBtn.style.display = 'none';
    } else {
        shopBtn.style.display = 'none';
        openShopBtn.style.display = 'inline-block';
    }
}

// Kullanıcı bilgisini göster
function displayUserInfo() {
    const user = db.getCurrentUser();
    const userDisplay = document.getElementById('userDisplay');
    
    if (user.isAdmin) {
        userDisplay.textContent = '👨‍💼 ' + user.name;
    } else {
        userDisplay.textContent = '👤 ' + user.name;
    }
}

// Çıkış yap
function handleLogout() {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    }
}


function setupEventListeners() {
    // Panel geçişi
    document.getElementById('customerBtn').addEventListener('click', switchToCustomer);
    document.getElementById('shopBtn').addEventListener('click', switchToShop);
    document.getElementById('openShopBtn').addEventListener('click', openShopModal);

    // Çıkış butonu
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Çıkış işlevini profile'dan kaldırdığımız için sadece logout butonundan olacak
    document.addEventListener('click', (e) => {
        if (e.target.id === 'logoutUserBtn') {
            handleLogout();
        }
    });

    // Müşteri sekmeleri
    document.querySelectorAll('.customer-tab-btn').forEach(btn => {
        btn.addEventListener('click', switchCustomerTab);
    });

    // Yönetici sekmeleri
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', switchAdminTab);
    });

    // Restorant formu
    document.getElementById('restaurantForm').addEventListener('submit', handleRestaurantSubmit);
    document.getElementById('cancelEditBtn').addEventListener('click', cancelRestaurantEdit);

    // Yemek formu
    document.getElementById('foodForm').addEventListener('submit', handleFoodSubmit);
    document.getElementById('cancelFoodEditBtn').addEventListener('click', cancelFoodEdit);

    // Müşteri arama
    document.getElementById('searchRestaurant').addEventListener('input', filterRestaurants);

    // Sepet
    document.getElementById('checkoutBtn').addEventListener('click', checkout);

    // Modal kapatma
    document.querySelector('.close')?.addEventListener('click', closeModal);
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
    const restaurants = db.getRestaurants();
    const restaurant = restaurants.find(r => r.id == restaurantId);
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
                    <button class="add-to-cart-btn" onclick="addToCart(${f.id}, '${f.name}', ${f.price}, '${restaurant.name}')">Sepete Ekle</button>
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

function addToCart(foodId, foodName, price, restaurantName) {
    const item = currentCart.find(i => i.foodId == foodId);
    
    if (item) {
        item.quantity += 1;
    } else {
        currentCart.push({
            foodId,
            foodName,
            price,
            restaurantName,
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
        document.querySelectorAll('.customer-tab-btn')[2].click();
        return;
    }
    
    // Hepsini aynı restorandan mı siparişler
    const restaurants = [...new Set(currentCart.map(i => i.restaurantName))];
    if (restaurants.length > 1) {
        alert('Farklı restorantlardan aynı anda sipariş veremezsiniz. Lütfen bir restoranttan sipariş verin.');
        return;
    }
    
    const restaurantId = db.getRestaurants().find(r => r.name === restaurants[0]).id;
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const items = currentCart.map(i => `${i.foodName} x${i.quantity}`).join(', ');
    
    db.addOrder(restaurantId, items, total, user.phone);
    
    alert('✅ Siparişiniz alındı! Sipariş ID: ' + db.getOrders()[db.getOrders().length - 1].id);
    currentCart = [];
    updateCart();
}

function renderMyOrders() {
    const orders = db.getOrdersByUser();
    
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
                <input type="tel" id="profilePhone" value="${user.phone}" placeholder="5XX XXX XXXX">
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
    const name = document.getElementById('profileName').value || 'Misafir Kullanıcı';
    const phone = document.getElementById('profilePhone').value;
    const email = document.getElementById('profileEmail').value;
    
    db.updateUser(name, phone, email);
    displayUserInfo();
    alert('✅ Profiliniz güncellendi!');
}

// ====================
// YÖNETİCİ ARAYÜZÜ
// ====================

function switchToAdmin() {
    document.getElementById('adminPanel').classList.add('active');
    document.getElementById('customerPanel').classList.remove('active');
    document.getElementById('adminBtn').classList.add('active');
    document.getElementById('customerBtn').classList.remove('active');
    renderAdminView();
}

function switchAdminTab(e) {
    const tabName = e.target.dataset.tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    
    e.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');

    if (tabName === 'restaurants-tab') {
        renderRestaurantTable();
    } else if (tabName === 'foods-tab') {
        renderFoodTable();
    } else if (tabName === 'orders-tab') {
        renderOrderTable();
    }
}

function renderAdminView() {
    renderRestaurantTable();
    updateRestaurantSelect();
}

// ===== RESTORANLAR =====

function renderRestaurantTable() {
    const restaurants = db.getRestaurants();
    
    const html = restaurants.map(r => `
        <tr>
            <td>${r.name}</td>
            <td>${r.desc || '-'}</td>
            <td>${r.phone}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-warning" onclick="editRestaurant(${r.id})">Düzenle</button>
                    <button class="btn btn-danger" onclick="deleteRestaurantClick(${r.id})">Sil</button>
                </div>
            </td>
        </tr>
    `).join('');
    
    document.getElementById('restaurantTableBody').innerHTML = html || '<tr><td colspan="4">Restorant yok</td></tr>';
}

function handleRestaurantSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('restaurantId').value;
    const name = document.getElementById('restaurantName').value;
    const desc = document.getElementById('restaurantDesc').value;
    const phone = document.getElementById('restaurantPhone').value;
    
    if (id) {
        db.updateRestaurant(parseInt(id), name, desc, phone);
        alert('✅ Restorant güncellendi!');
    } else {
        db.addRestaurant(name, desc, phone);
        alert('✅ Restorant eklendi!');
    }
    
    this.reset();
    cancelRestaurantEdit();
    renderRestaurantTable();
    updateRestaurantSelect();
}

function editRestaurant(id) {
    const restaurants = db.getRestaurants();
    const restaurant = restaurants.find(r => r.id == id);
    
    document.getElementById('restaurantId').value = id;
    document.getElementById('restaurantName').value = restaurant.name;
    document.getElementById('restaurantDesc').value = restaurant.desc;
    document.getElementById('restaurantPhone').value = restaurant.phone;
    document.getElementById('cancelEditBtn').style.display = 'inline-block';
    
    document.getElementById('restaurantForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelRestaurantEdit() {
    document.getElementById('restaurantForm').reset();
    document.getElementById('restaurantId').value = '';
    document.getElementById('cancelEditBtn').style.display = 'none';
}

function deleteRestaurantClick(id) {
    if (confirm('Bu restorantı silmek istediğinizden emin misiniz? İlgili tüm yemekler de silinecek.')) {
        db.deleteRestaurant(id);
        alert('✅ Restorant silindi!');
        renderRestaurantTable();
        updateRestaurantSelect();
    }
}

// ===== YEMEKLER =====

function renderFoodTable() {
    const foods = db.getFoods();
    const restaurants = db.getRestaurants();
    
    const html = foods.map(f => {
        const restaurant = restaurants.find(r => r.id == f.restaurantId);
        return `
            <tr>
                <td>${restaurant?.name || '-'}</td>
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
        `;
    }).join('');
    
    document.getElementById('foodTableBody').innerHTML = html || '<tr><td colspan="5">Yemek yok</td></tr>';
}

function updateRestaurantSelect() {
    const restaurants = db.getRestaurants();
    const select = document.getElementById('foodRestaurant');
    
    select.innerHTML = '<option value="">Restorant Seç</option>' + 
        restaurants.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
}

function handleFoodSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('foodId').value;
    const restaurantId = document.getElementById('foodRestaurant').value;
    const name = document.getElementById('foodName').value;
    const desc = document.getElementById('foodDesc').value;
    const price = document.getElementById('foodPrice').value;
    
    if (!restaurantId) {
        alert('Lütfen restorant seçin!');
        return;
    }
    
    if (id) {
        db.updateFood(parseInt(id), name, desc, price, restaurantId);
        alert('✅ Yemek güncellendi!');
    } else {
        db.addFood(restaurantId, name, desc, price);
        alert('✅ Yemek eklendi!');
    }
    
    this.reset();
    cancelFoodEdit();
    renderFoodTable();
}

function editFood(id) {
    const foods = db.getFoods();
    const food = foods.find(f => f.id == id);
    
    document.getElementById('foodId').value = id;
    document.getElementById('foodRestaurant').value = food.restaurantId;
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

// ===== SİPARİŞLER =====

function renderOrderTable() {
    const orders = db.getOrders();
    const restaurants = db.getRestaurants();
    
    const html = orders.map(o => {
        const restaurant = restaurants.find(r => r.id == o.restaurantId);
        return `
            <tr>
                <td>${o.id}</td>
                <td>${restaurant?.name || '-'}</td>
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
        `;
    }).join('');
    
    document.getElementById('ordersTableBody').innerHTML = html || '<tr><td colspan="7">Sipariş yok</td></tr>';
}

function updateOrderStatus(orderId, status) {
    db.updateOrderStatus(orderId, status);
    alert('✅ Sipariş durumu güncellendi!');
    renderOrderTable();
}
