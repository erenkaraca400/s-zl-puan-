function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                console.log('🔔 Bildirim izni verildi');
            }
        });
    }
}

function sendNotification(title, message, targetType = 'admin', targetId = null, orderId = null) {
    // Tarayıcı bildirimi (eğer izin varsa)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body: message, icon: '/favicon.ico' });
    }
    
    // Konsol bildirimi
    console.log(`🔔 BİLDİRİM: ${title} - ${message}`);
    
    // Local bildirim geçmişi
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    notifications.unshift({
        id: Date.now(),
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        targetType,
        targetId,
        orderId
    });
    
    // Son 50 bildirimi tut
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    localStorage.setItem('notifications', JSON.stringify(notifications));
    
    const userRole = localStorage.getItem('userRole');
    const currentUser = db.getCurrentUser();
    
    if (userRole === 'admin' && targetType === 'admin') {
        updateNotificationBadge();
        const activeTab = document.querySelector('#adminPanel .tab-content.active');
        if (activeTab && activeTab.id === 'admin-notifications') {
            renderAdminNotifications();
        }
    }
    
    if (currentUser?.isShopOwner && targetType === 'shopOwner' && targetId === currentUser.id) {
        updateShopNotificationBadge();
        renderShopNotifications();
    }
    
    if (currentUser && targetType === 'customer' && targetId === currentUser.id) {
        renderCustomerNotifications();
    }
}

function getCurrentNotifications() {
    const currentUser = db.getCurrentUser();
    const userRole = localStorage.getItem('userRole');
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    
    if (userRole === 'admin') {
        return notifications.filter(n => n.targetType === 'admin' || n.targetType === null);
    }
    if (currentUser?.isShopOwner) {
        return notifications.filter(n => n.targetType === 'shopOwner' && n.targetId === currentUser.id);
    }
    return notifications.filter(n => n.targetType === 'customer' && n.targetId === currentUser.id);
}

class Database {
    constructor() {
        this.initializeData();
    }

    initializeData() {
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify([]));
        }
        if (!localStorage.getItem('restaurants')) {
            localStorage.setItem('restaurants', JSON.stringify([]));
        }
        if (!localStorage.getItem('foods')) {
            localStorage.setItem('foods', JSON.stringify([]));
        }
        if (!localStorage.getItem('orders')) {
            localStorage.setItem('orders', JSON.stringify([]));
        }
        this.seedDemoData();
        this.ensureUserCreditData();
    }

    ensureUserCreditData() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        let shouldUpdate = false;
        const updatedUsers = users.map(user => {
            const updatedUser = { ...user };
            if (updatedUser.creditLimit == null) {
                updatedUser.creditLimit = 5000;
                shouldUpdate = true;
            }
            if (updatedUser.usedCredit == null) {
                updatedUser.usedCredit = 0;
                shouldUpdate = true;
            }
            if (!updatedUser.address) {
                updatedUser.address = 'Adres bilgisi güncellenecek';
                shouldUpdate = true;
            }
            if (!updatedUser.city) {
                updatedUser.city = 'İstanbul';
                shouldUpdate = true;
            }
            if (!updatedUser.district) {
                updatedUser.district = 'Kadıköy';
                shouldUpdate = true;
            }
            return updatedUser;
        });
        if (shouldUpdate) {
            localStorage.setItem('users', JSON.stringify(updatedUsers));

            const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
            const refreshed = updatedUsers.find(u => u.id === currentUser.id);
            if (refreshed) {
                localStorage.setItem('currentUser', JSON.stringify(refreshed));
            }
        }
    }

    seedDemoData() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const restaurants = JSON.parse(localStorage.getItem('restaurants') || '[]');
        const foods = JSON.parse(localStorage.getItem('foods') || '[]');

        if (users.length >= 10 && restaurants.length >= 6 && foods.length >= 20) {
            return;
        }

        const sampleUsers = [
            {
                id: 1001,
                firstName: 'Ahmet',
                lastName: 'Yıldız',
                name: 'Ahmet Yıldız',
                phone: '05551234567',
                address: 'Atatürk Caddesi No: 123',
                city: 'İstanbul',
                district: 'Kadıköy',
                email: 'ahmet@example.com',
                password: '123456',
                isShopOwner: false,
                shopData: null,
                createdAt: '01.01.2025'
            },
            {
                id: 1002,
                firstName: 'Fatma',
                lastName: 'Kara',
                name: 'Fatma Kara',
                phone: '05557654321',
                address: 'Cumhuriyet Mahallesi No: 45',
                city: 'İstanbul',
                district: 'Üsküdar',
                email: 'fatma@example.com',
                password: '123456',
                isShopOwner: true,
                shopData: {
                    name: 'Kumru Döner',
                    desc: 'Lezzetli döner ve mezeler',
                    phone: '05557654321',
                    imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
                    tin: '1234567890',
                    licenseDate: '2025-01-01',
                    createdAt: '01.01.2025'
                },
                createdAt: '01.01.2025'
            },
            {
                id: 1003,
                firstName: 'Merve',
                lastName: 'Demir',
                name: 'Merve Demir',
                phone: '05559876543',
                address: 'Bahçelievler Sokak No: 67',
                city: 'İstanbul',
                district: 'Bahçelievler',
                email: 'merve@example.com',
                password: '123456',
                isShopOwner: true,
                shopData: {
                    name: 'Pideci Usta',
                    desc: 'Sıcak pide ve lahmacun',
                    phone: '05559876543',
                    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
                    tin: '0987654321',
                    licenseDate: '2025-02-10',
                    createdAt: '10.02.2025'
                },
                createdAt: '10.02.2025'
            },
            {
                id: 1004,
                firstName: 'Ali',
                lastName: 'Çelik',
                name: 'Ali Çelik',
                phone: '05551111111',
                address: 'Abdi İpekçi Caddesi No: 89',
                city: 'İstanbul',
                district: 'Şişli',
                email: 'ali@example.com',
                password: '123456',
                isShopOwner: true,
                shopData: {
                    name: 'Burger House',
                    desc: 'Amerikan tarzı burgerler',
                    phone: '05551111111',
                    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                    tin: '1111111111',
                    licenseDate: '2025-03-01',
                    createdAt: '01.03.2025'
                },
                createdAt: '01.03.2025'
            },
            {
                id: 1005,
                firstName: 'Zeynep',
                lastName: 'Öztürk',
                name: 'Zeynep Öztürk',
                phone: '05552222222',
                address: 'Beşiktaş Caddesi No: 12',
                city: 'İstanbul',
                district: 'Beşiktaş',
                email: 'zeynep@example.com',
                password: '123456',
                isShopOwner: true,
                shopData: {
                    name: 'Pizza Palace',
                    desc: 'İtalyan pizzaları ve makarnalar',
                    phone: '05552222222',
                    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
                    tin: '2222222222',
                    licenseDate: '2025-03-15',
                    createdAt: '15.03.2025'
                },
                createdAt: '15.03.2025'
            },
            {
                id: 1006,
                firstName: 'Mehmet',
                lastName: 'Şahin',
                name: 'Mehmet Şahin',
                phone: '05553333333',
                address: 'Fatih Sultan Mehmet Caddesi No: 34',
                city: 'İstanbul',
                district: 'Fatih',
                email: 'mehmet@example.com',
                password: '123456',
                isShopOwner: true,
                shopData: {
                    name: 'Çiğ Köfteci',
                    desc: 'Geleneksel çiğ köfte ve mezeler',
                    phone: '05553333333',
                    imageUrl: 'https://images.unsplash.com/photo-1541599468348-e96984315621?auto=format&fit=crop&w=800&q=80',
                    tin: '3333333333',
                    licenseDate: '2025-04-01',
                    createdAt: '01.04.2025'
                },
                createdAt: '01.04.2025'
            },
            {
                id: 1007,
                firstName: 'Ayşe',
                lastName: 'Yılmaz',
                name: 'Ayşe Yılmaz',
                phone: '05554444444',
                address: 'Taksim Meydanı No: 56',
                city: 'İstanbul',
                district: 'Beyoğlu',
                email: 'ayse@example.com',
                password: '123456',
                isShopOwner: true,
                shopData: {
                    name: 'Kahve Dünyası',
                    desc: 'Özel kahveler ve tatlılar',
                    phone: '05554444444',
                    imageUrl: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80',
                    tin: '4444444444',
                    licenseDate: '2025-04-10',
                    createdAt: '10.04.2025'
                },
                createdAt: '10.04.2025'
            },
            {
                id: 1008,
                firstName: 'Can',
                lastName: 'Kaya',
                name: 'Can Kaya',
                phone: '05555555555',
                address: 'Levent Caddesi No: 78',
                city: 'İstanbul',
                district: 'Beşiktaş',
                email: 'can@example.com',
                password: '123456',
                isShopOwner: false,
                shopData: null,
                createdAt: '20.04.2025'
            },
            {
                id: 1009,
                firstName: 'Elif',
                lastName: 'Aydın',
                name: 'Elif Aydın',
                phone: '05556666666',
                address: 'Maslak Mahallesi No: 90',
                city: 'İstanbul',
                district: 'Sarıyer',
                email: 'elif@example.com',
                password: '123456',
                isShopOwner: false,
                shopData: null,
                createdAt: '25.04.2025'
            },
            {
                id: 1010,
                firstName: 'Burak',
                lastName: 'Koç',
                name: 'Burak Koç',
                phone: '05557777777',
                address: 'Ümraniye Caddesi No: 101',
                city: 'İstanbul',
                district: 'Ümraniye',
                email: 'burak@example.com',
                password: '123456',
                isShopOwner: false,
                shopData: null,
                createdAt: '30.04.2025'
            }
        ];

        const sampleRestaurants = [
            {
                id: 2001,
                ownerId: 1002,
                name: 'Kumru Döner',
                desc: 'Lezzetli döner ve mezeler',
                phone: '05557654321',
                imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80',
                createdAt: '01.01.2025'
            },
            {
                id: 2002,
                ownerId: 1003,
                name: 'Pideci Usta',
                desc: 'Sıcak pide ve lahmacun',
                phone: '05559876543',
                imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
                createdAt: '10.02.2025'
            },
            {
                id: 2003,
                ownerId: 1004,
                name: 'Burger House',
                desc: 'Amerikan tarzı burgerler',
                phone: '05551111111',
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
                createdAt: '01.03.2025'
            },
            {
                id: 2004,
                ownerId: 1005,
                name: 'Pizza Palace',
                desc: 'İtalyan pizzaları ve makarnalar',
                phone: '05552222222',
                imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
                createdAt: '15.03.2025'
            },
            {
                id: 2005,
                ownerId: 1006,
                name: 'Çiğ Köfteci',
                desc: 'Geleneksel çiğ köfte ve mezeler',
                phone: '05553333333',
                imageUrl: 'https://images.unsplash.com/photo-1541599468348-e96984315621?auto=format&fit=crop&w=800&q=80',
                createdAt: '01.04.2025'
            },
            {
                id: 2006,
                ownerId: 1007,
                name: 'Kahve Dünyası',
                desc: 'Özel kahveler ve tatlılar',
                phone: '05554444444',
                imageUrl: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80',
                createdAt: '10.04.2025'
            }
        ];

        const sampleFoods = [
            // Kumru Döner yemekleri
            {
                id: 3001,
                restaurantId: 2001,
                name: 'Et Döner',
                desc: 'Bol etli, özel soslu döner',
                price: 85,
                imageUrl: 'https://images.unsplash.com/photo-1604908177522-8c376fc08c42?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3002,
                restaurantId: 2001,
                name: 'Tavuk Döner',
                desc: 'Yumuşacık tavuk döner',
                price: 70,
                imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3003,
                restaurantId: 2001,
                name: 'İskender Kebap',
                desc: 'Yoğurtlu, tereyağlı İskender',
                price: 120,
                imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3004,
                restaurantId: 2001,
                name: 'Çiğ Köfte',
                desc: 'El yapımı çiğ köfte',
                price: 45,
                imageUrl: 'https://images.unsplash.com/photo-1541599468348-e96984315621?auto=format&fit=crop&w=800&q=80'
            },

            // Pideci Usta yemekleri
            {
                id: 3005,
                restaurantId: 2002,
                name: 'Kıymalı Pide',
                desc: 'Kıymalı pide, nefis lezzet',
                price: 90,
                imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3006,
                restaurantId: 2002,
                name: 'Lahmacun',
                desc: 'Kıtır kıtır lahmacun',
                price: 40,
                imageUrl: 'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3007,
                restaurantId: 2002,
                name: 'Kaşarlı Pide',
                desc: 'Sıcak kaşarlı pide',
                price: 75,
                imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3008,
                restaurantId: 2002,
                name: 'Kuşbaşılı Pide',
                desc: 'Kuşbaşı etli pide',
                price: 110,
                imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'
            },

            // Burger House yemekleri
            {
                id: 3009,
                restaurantId: 2003,
                name: 'Classic Burger',
                desc: 'Dana eti, cheddar peyniri, marul, domates',
                price: 95,
                imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3010,
                restaurantId: 2003,
                name: 'Chicken Burger',
                desc: 'Tavuk göğsü, özel sos, patates kızartması ile',
                price: 85,
                imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3011,
                restaurantId: 2003,
                name: 'Double Cheeseburger',
                desc: 'Çift dana eti, bol cheddar',
                price: 125,
                imageUrl: 'https://images.unsplash.com/photo-1551782450-17144efb5723?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3012,
                restaurantId: 2003,
                name: 'Veggie Burger',
                desc: 'Sebzeli burger, vegan',
                price: 75,
                imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=800&q=80'
            },

            // Pizza Palace yemekleri
            {
                id: 3013,
                restaurantId: 2004,
                name: 'Margherita Pizza',
                desc: 'Domates, mozzarella, fesleğen',
                price: 85,
                imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3014,
                restaurantId: 2004,
                name: 'Pepperoni Pizza',
                desc: 'Pepperoni, mozzarella, domates sosu',
                price: 105,
                imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3015,
                restaurantId: 2004,
                name: 'Carbonara Makarna',
                desc: 'Krema, parmesan, jambon',
                price: 75,
                imageUrl: 'https://images.unsplash.com/photo-1551892376-c73a4e14c03f?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3016,
                restaurantId: 2004,
                name: 'Pesto Makarna',
                desc: 'Fesleğen soslu, parmesanlı',
                price: 70,
                imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=800&q=80'
            },

            // Çiğ Köfteci yemekleri
            {
                id: 3017,
                restaurantId: 2005,
                name: 'Çiğ Köfte',
                desc: 'El yapımı, baharatlı çiğ köfte',
                price: 45,
                imageUrl: 'https://images.unsplash.com/photo-1541599468348-e96984315621?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3018,
                restaurantId: 2005,
                name: 'Çiğ Köfte Dürüm',
                desc: 'Çiğ köfte dürüm, marul, soğan ile',
                price: 55,
                imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3019,
                restaurantId: 2005,
                name: 'Yoğurtlu Çiğ Köfte',
                desc: 'Yoğurtlu çiğ köfte',
                price: 50,
                imageUrl: 'https://images.unsplash.com/photo-1574484284002-952d92456975?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3020,
                restaurantId: 2005,
                name: 'Çiğ Köfte Platter',
                desc: 'Çiğ köfte tabağı, çeşitli mezeler ile',
                price: 85,
                imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80'
            },

            // Kahve Dünyası yemekleri
            {
                id: 3021,
                restaurantId: 2006,
                name: 'Türk Kahvesi',
                desc: 'Geleneksel Türk kahvesi',
                price: 25,
                imageUrl: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3022,
                restaurantId: 2006,
                name: 'Cappuccino',
                desc: 'İtalyan kahvesi, süt köpüğü ile',
                price: 35,
                imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3023,
                restaurantId: 2006,
                name: 'Cheesecake',
                desc: 'Kremalı cheesecake',
                price: 45,
                imageUrl: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80'
            },
            {
                id: 3024,
                restaurantId: 2006,
                name: 'Baklava',
                desc: 'Antep fıstıklı baklava',
                price: 40,
                imageUrl: 'https://images.unsplash.com/photo-1481391032119-d89fee7f3d0c?auto=format&fit=crop&w=800&q=80'
            }
        ];

        localStorage.setItem('users', JSON.stringify(sampleUsers));
        localStorage.setItem('restaurants', JSON.stringify(sampleRestaurants));
        localStorage.setItem('foods', JSON.stringify(sampleFoods));
    }

    // Restoranlar (Dükkânlar)
    getRestaurants() {
        return JSON.parse(localStorage.getItem('restaurants') || '[]');
    }

    addRestaurant(ownerId, name, desc, phone, imageUrl = 'https://via.placeholder.com/400x250?text=Restoran') {
        const restaurants = this.getRestaurants();
        const restaurant = {
            id: Date.now(),
            ownerId,
            name,
            desc,
            phone,
            imageUrl,
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

    updateRestaurant(id, name, desc, phone, imageUrl) {
        let restaurants = this.getRestaurants();
        restaurants = restaurants.map(r => 
            r.id == id ? { ...r, name, desc, phone, imageUrl: imageUrl || r.imageUrl } : r
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

    addFood(restaurantId, name, desc, price, imageUrl = 'https://via.placeholder.com/400x250?text=Yemek') {
        const foods = this.getFoods();
        const food = {
            id: Date.now(),
            restaurantId: parseInt(restaurantId),
            name,
            desc,
            price: parseFloat(price),
            imageUrl
        };
        foods.push(food);
        localStorage.setItem('foods', JSON.stringify(foods));
        return food;
    }

    updateFood(id, name, desc, price, imageUrl) {
        let foods = this.getFoods();
        foods = foods.map(f => 
            f.id == id ? { ...f, name, desc, price: parseFloat(price), imageUrl: imageUrl || f.imageUrl } : f
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

    addOrder(restaurantId, items, total, userPhone, userId, paymentMethod = 'Nakit', paymentData = {}) {
        const orders = this.getOrders();
        const order = {
            id: 'SIP-' + Date.now(),
            restaurantId: parseInt(restaurantId),
            items,
            total: parseFloat(total),
            userPhone,
            status: 'Bekleme',
            createdAt: new Date().toLocaleString('tr-TR'),
            userId,
            paymentMethod,
            paymentData,
            cardLast4: paymentData.cardLast4 || ''
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
    document.getElementById('checkoutBtn').addEventListener('click', openCheckoutModal);
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
        
        // Bildirim izni iste
        requestNotificationPermission();
        updateNotificationBadge();
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
        localStorage.removeItem('userRole');
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
                        <label style="display: block; font-weight: 600; margin-bottom: 5px;">Dükkan Resim Yükle</label>
                        <input type="file" id="modalShopImageFile" accept="image/*" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px;">
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

async function createShop(modal) {
    const name = modal.querySelector('#modalShopName').value;
    const desc = modal.querySelector('#modalShopDesc').value;
    const phone = modal.querySelector('#modalShopPhone').value;
    const tin = modal.querySelector('#modalShopTIN').value;
    const licenseDate = modal.querySelector('#modalShopLicenseDate').value;
    const imageFile = modal.querySelector('#modalShopImageFile').files[0];
    
    if (!name || !desc || !phone || !tin || !licenseDate || !imageFile) {
        alert('Lütfen tüm alanları doldurun!');
        return;
    }
    
    const user = db.getCurrentUser();
    const imageUrl = await fileToBase64(imageFile);
    const shopData = {
        name,
        desc,
        phone,
        imageUrl,
        tin,
        licenseDate,
        createdAt: new Date().toLocaleString('tr-TR')
    };
    
    user.isShopOwner = true;
    user.shopData = shopData;
    
    db.updateUser(user);
    db.addRestaurant(user.id, name, desc, phone, imageUrl);
    
    // Bildirim gönder
    sendNotification(`🏪 Yeni dükkan açıldı: ${name}`, 'Yeni bir dükkan sisteme katıldı!');
    
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
        <div class="restaurant-card">
            <img src="${r.imageUrl || 'https://via.placeholder.com/400x250?text=Restoran'}" alt="${r.name}" />
            <h3>🍽️ ${r.name}</h3>
            <p>${r.desc || 'Açıklama yok'}</p>
            <p class="phone">📞 ${r.phone}</p>
            <button class="btn btn-primary" onclick="viewRestaurant(${r.id})" style="width: 100%; margin-top: 10px;">Sipariş Ver</button>
        </div>
    `).join('');
    
    document.getElementById('restaurantList').innerHTML = html || '<p>Henüz restorant eklenmedi</p>';
}

function filterRestaurants() {
    const searchTerm = document.getElementById('searchRestaurant').value.toLowerCase();
    const restaurants = db.getRestaurants();
    const filtered = restaurants.filter(r => r.name.toLowerCase().includes(searchTerm));
    
    const html = filtered.map(r => `
        <div class="restaurant-card">
            <img src="${r.imageUrl || 'https://via.placeholder.com/400x250?text=Restoran'}" alt="${r.name}" />
            <h3>🍽️ ${r.name}</h3>
            <p>${r.desc || 'Açıklama yok'}</p>
            <p class="phone">📞 ${r.phone}</p>
            <button class="btn btn-primary" onclick="viewRestaurant(${r.id})" style="width: 100%; margin-top: 10px;">Sipariş Ver</button>
        </div>
    `).join('');
    
    document.getElementById('restaurantList').innerHTML = html || '<p>Restorant bulunamadı</p>';
}

function viewRestaurant(restaurantId) {
    const restaurant = db.getRestaurantById(restaurantId);
    const foods = db.getFoodsByRestaurant(restaurantId);
    
    let html = `
        <div class="detail-header">
            <img class="detail-image" src="${restaurant.imageUrl || 'https://via.placeholder.com/400x250?text=Restoran'}" alt="${restaurant.name}" />
            <h2>${restaurant.name}</h2>
            <p>${restaurant.desc}</p>
            <p>📞 ${restaurant.phone}</p>
        </div>
        <div class="foods-list">
    `;
    
    if (foods.length > 0) {
        html += foods.map(f => `
            <div class="food-item">
                <img src="${f.imageUrl || 'https://via.placeholder.com/400x250?text=Yemek'}" alt="${f.name}" />
                <h4>${f.name}</h4>
                <p class="description">${f.desc}</p>
                <div class="food-item-footer">
                    <span class="food-price">₺${f.price.toFixed(2)}</span>
                    <button class="add-to-cart-btn" onclick="addToCart(${f.id}, '${f.name}', ${f.price}, '${restaurant.name}', ${restaurant.id})">Sepete Ekle</button>
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

function openCheckoutModal() {
    if (currentCart.length === 0) return;

    const user = db.getCurrentUser();
    if (!user.phone) {
        alert('Lütfen profilinize telefon numarası ekleyin!');
        return;
    }

    const restaurantId = currentCart[0].restaurantId;
    const restaurant = db.getRestaurantById(restaurantId);
    const total = currentCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const remainingCredit = (user.creditLimit || 0) - (user.usedCredit || 0);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 700px; max-height: 90vh; overflow-y: auto;">
            <span class="close">&times;</span>
            <h2 style="color: #667eea; margin-bottom: 15px;">🛒 Ödeme ve Sipariş Onayı</h2>
            <div style="margin-bottom: 20px;">
                <p><strong>Restorant:</strong> ${restaurant?.name || 'Bilinmiyor'}</p>
                <p><strong>Toplam:</strong> ₺${total.toFixed(2)}</p>
                <p><strong>Mevcut Kredi Limiti:</strong> ₺${user.creditLimit || 0} (Kalan: ₺${remainingCredit >= 0 ? remainingCredit.toFixed(2) : '0'})</p>
            </div>
            <form id="checkoutForm" style="display: flex; flex-direction: column; gap: 15px;">
                <div><strong>Ödeme Yöntemi</strong></div>
                <label class="payment-option"><input type="radio" name="paymentMethod" value="Nakit" checked> Nakit</label>
                <label class="payment-option"><input type="radio" name="paymentMethod" value="Post"> Post</label>
                <label class="payment-option"><input type="radio" name="paymentMethod" value="Kredi Kartı"> Kredi Kartı</label>
                <label class="payment-option"><input type="radio" name="paymentMethod" value="Gel Al"> Gel Al</label>
                <div id="addressFields" class="payment-details">
                    <div><strong>Teslimat Adresi</strong></div>
                    <input type="text" id="deliveryAddress" placeholder="Adres" required>
                    <input type="text" id="deliveryCity" placeholder="İl" required>
                    <input type="text" id="deliveryDistrict" placeholder="İlçe" required>
                </div>
                <div id="cardFields" class="payment-details">
                    <input type="text" id="cardNumber" placeholder="Kart Numarası" maxlength="19" pattern="[0-9 ]*" required>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                        <input type="text" id="cardExpiry" placeholder="AA/YY" required>
                        <input type="text" id="cardCvc" placeholder="CVC" maxlength="4" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-success">Ödemeyi Onayla</button>
            </form>
        </div>
    `;

    document.body.appendChild(modal);
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    const paymentOptions = modal.querySelectorAll('input[name="paymentMethod"]');
    const cardFields = modal.querySelector('#cardFields');
    const addressFields = modal.querySelector('#addressFields');
    paymentOptions.forEach(input => {
        input.addEventListener('change', () => {
            cardFields.style.display = input.value === 'Kredi Kartı' ? 'flex' : 'none';
            addressFields.style.display = input.value === 'Gel Al' ? 'none' : 'flex';
        });
    });

    cardFields.style.display = 'none';
    addressFields.style.display = 'flex'; // Show by default since Nakit is checked

    modal.querySelector('#checkoutForm').addEventListener('submit', (e) => {
        e.preventDefault();
        processCheckout(modal, restaurant, total);
    });
}

function processCheckout(modal, restaurant, total) {
    const user = db.getCurrentUser();
    const paymentMethod = modal.querySelector('input[name="paymentMethod"]:checked').value;
    const paymentData = {};

    // Address validation for delivery methods
    if (paymentMethod !== 'Gel Al') {
        const deliveryAddress = modal.querySelector('#deliveryAddress').value.trim();
        const deliveryCity = modal.querySelector('#deliveryCity').value.trim();
        const deliveryDistrict = modal.querySelector('#deliveryDistrict').value.trim();

        if (!deliveryAddress || !deliveryCity || !deliveryDistrict) {
            alert('Lütfen teslimat adresini eksiksiz girin!');
            return;
        }

        paymentData.deliveryAddress = deliveryAddress;
        paymentData.deliveryCity = deliveryCity;
        paymentData.deliveryDistrict = deliveryDistrict;
    }

    if (paymentMethod === 'Kredi Kartı') {
        const cardNumber = modal.querySelector('#cardNumber').value.replace(/\s+/g, '');
        const cardExpiry = modal.querySelector('#cardExpiry').value;
        const cardCvc = modal.querySelector('#cardCvc').value;

        if (!/^\d{16}$/.test(cardNumber) || !/^\d{2}\/\d{2}$/.test(cardExpiry) || !/^\d{3,4}$/.test(cardCvc)) {
            alert('Lütfen geçerli kart bilgilerini girin!');
            return;
        }

        paymentData.cardLast4 = cardNumber.slice(-4);
        paymentData.cardExpiry = cardExpiry;
        paymentData.paymentType = 'Kredi Kartı';
        // Removed credit check for demo purposes
    }

    const items = currentCart.map(i => `${i.foodName} x${i.quantity}`).join(', ');
    const order = db.addOrder(restaurant.id, items, total, user.phone, user.id, paymentMethod, paymentData);

    sendNotification(
        `📦 Yeni sipariş: ${restaurant.name}`,
        `Sipariş ID: ${order.id}\nMüşteri: ${user.name} (${user.phone})\nTutar: ₺${total.toFixed(2)}\nÖdeme: ${paymentMethod}`,
        'shopOwner',
        restaurant.ownerId,
        order.id
    );

    sendNotification(
        `� Yeni sipariş: ${restaurant.name}`,
        `Sipariş ID: ${order.id}\nMüşteri: ${user.name} (${user.phone})\nTutar: ₺${total.toFixed(2)}\nÖdeme: ${paymentMethod}`,
        'admin',
        null,
        order.id
    );

    sendNotification(
        `�📋 Siparişiniz alındı`,
        `Siparişiniz restorana iletildi. Sipariş ID: ${order.id}`,
        'customer',
        user.id,
        order.id
    );

    alert('✅ Siparişiniz alındı! Sipariş ID: ' + order.id);
    currentCart = [];
    updateCart();
    modal.remove();
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
        const paymentLabel = order.paymentMethod ? `${order.paymentMethod}${order.cardLast4 ? ' (****' + order.cardLast4 + ')' : ''}` : 'Bilinmiyor';
        
        return `
            <div class="order-card">
                <h3>${order.id}</h3>
                <div class="order-details">
                    <p><strong>Restorant:</strong> ${restaurant?.name || 'Bilinmiyor'}</p>
                    <p><strong>Tarih:</strong> ${order.createdAt}</p>
                </div>
                <div class="order-items"><strong>Ürünler:</strong> ${order.items}</div>
                <p><strong>Toplam:</strong> ₺${order.total.toFixed(2)}</p>
                <p><strong>Ödeme:</strong> ${paymentLabel}</p>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
        `;
    }).join('');
    
    document.getElementById('myOrdersList').innerHTML = html;
}

function renderCustomerNotifications() {
    const notifications = getCurrentNotifications();
    const listContainer = document.getElementById('customerNotificationsList');
    if (!listContainer) return;
    
    if (notifications.length === 0) {
        listContainer.innerHTML = '<p style="padding: 15px; color: #6b7280;">Henüz bildirim yok</p>';
        return;
    }
    
    listContainer.innerHTML = notifications.map(n => {
        const date = new Date(n.timestamp).toLocaleString('tr-TR');
        const unreadClass = n.read ? '' : 'unread';
        return `
            <div class="notification-item ${unreadClass}" onclick="markNotificationAsRead(${n.id})">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <div class="timestamp">${date}</div>
            </div>
        `;
    }).join('');
}

function renderProfile() {
    const user = db.getCurrentUser();
    const remainingCredit = (user.creditLimit || 0) - (user.usedCredit || 0);
    
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
            <div class="profile-field">
                <label>Kredi Limiti</label>
                <input type="text" value="₺${user.creditLimit || 0} (Kalan: ₺${remainingCredit >= 0 ? remainingCredit.toFixed(2) : 0})" disabled>
            </div>
            <div class="profile-actions">
                <button class="btn btn-primary" onclick="saveProfile()">Kaydet</button>
            </div>
        </div>
        <div class="info-box" style="margin-top: 20px;">
            <h4>🔔 Bildirimler</h4>
            <div id="customerNotificationsList"></div>
        </div>
    `;
    
    document.getElementById('profileContent').innerHTML = html;
    renderCustomerNotifications();
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
    
    // Dükkan sahibi panelinde periyodik güncelleme (her 30 saniyede bir)
    if (window.shopUpdateInterval) {
        clearInterval(window.shopUpdateInterval);
    }
    window.shopUpdateInterval = setInterval(() => {
        // Eğer orders tab'ı aktifse güncelle
        const activeTab = document.querySelector('#shopPanel .tab-content.active');
        if (activeTab && activeTab.id === 'orders-tab') {
            renderOrderTable();
        }
    }, 30000);
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
    
    // Admin panelinde periyodik güncelleme (her 30 saniyede bir)
    if (window.adminUpdateInterval) {
        clearInterval(window.adminUpdateInterval);
    }
    window.adminUpdateInterval = setInterval(() => {
        renderAdminDashboard();
        updateNotificationBadge();
    }, 30000);
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
    if (tabName === 'admin-notifications') renderAdminNotifications();
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

function renderAdminNotifications() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
        .filter(n => n.targetType === 'admin' || n.targetType === null);
    
    if (notifications.length === 0) {
        document.getElementById('notificationsList').innerHTML = '<p style="text-align: center; padding: 20px; color: #6b7280;">Henüz bildirim yok</p>';
        return;
    }
    
    const html = notifications.map(n => {
        const date = new Date(n.timestamp).toLocaleString('tr-TR');
        const unreadClass = n.read ? '' : 'unread';
        return `
            <div class="notification-item ${unreadClass}" onclick="markNotificationAsRead(${n.id})">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <div class="timestamp">${date}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('notificationsList').innerHTML = html;
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

function markNotificationAsRead(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
        notification.read = true;
        localStorage.setItem('notifications', JSON.stringify(notifications));
        renderAdminNotifications();
        renderShopNotifications();
        renderCustomerNotifications();
        updateNotificationBadge();
        updateShopNotificationBadge();
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
    renderShopNotifications();
    renderMyShopInfo();
}

function renderShopNotifications() {
    const user = db.getCurrentUser();
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]')
        .filter(n => n.targetType === 'shopOwner' && n.targetId === user.id);
    const container = document.getElementById('shopNotificationsList');
    const box = document.getElementById('shopNotificationBox');

    if (!container || !box) return;

    if (notifications.length === 0) {
        box.style.display = 'none';
        return;
    }

    box.style.display = 'block';
    const html = notifications.map(n => {
        const date = new Date(n.timestamp).toLocaleString('tr-TR');
        const unreadClass = n.read ? '' : 'unread';
        return `
            <div class="notification-item ${unreadClass}" onclick="markNotificationAsRead(${n.id})">
                <h4>${n.title}</h4>
                <p>${n.message}</p>
                <div class="timestamp">${date}</div>
            </div>
        `;
    }).join('');
    container.innerHTML = html;
    updateShopNotificationBadge();
}

function updateShopNotificationBadge() {
    const user = db.getCurrentUser();
    const unreadCount = JSON.parse(localStorage.getItem('notifications') || '[]')
        .filter(n => n.targetType === 'shopOwner' && n.targetId === user.id && !n.read).length;
    const badge = document.getElementById('shopNotificationBadge');
    if (!badge) return;
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
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
        <img class="detail-image" src="${shop.imageUrl || 'https://via.placeholder.com/400x250?text=Restoran'}" alt="${shop.name}" />
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
            <td><img src="${f.imageUrl || 'https://via.placeholder.com/180x100?text=Yemek'}" alt="${f.name}" style="width: 120px; height: 80px; object-fit: cover; border-radius: 6px;" /></td>
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
    
    document.getElementById('foodTableBody').innerHTML = html || '<tr><td colspan="5">Yemek yok</td></tr>';
}

async function handleRestaurantSubmit(e) {
    e.preventDefault();
    const user = db.getCurrentUser();
    const name = document.getElementById('restaurantName').value;
    const desc = document.getElementById('restaurantDesc').value;
    const phone = document.getElementById('restaurantPhone').value;
    const imageFile = document.getElementById('restaurantImageFile')?.files[0];
    const shops = db.getRestaurantsByOwner(user.id);
    const imageUrl = imageFile ? await fileToBase64(imageFile) : undefined;
    
    if (shops.length > 0) {
        db.updateRestaurant(shops[0].id, name, desc, phone, imageUrl);
        alert('✅ Dükkan bilgileri güncellendi!');
    }
    
    renderMyShopInfo();
}

async function handleFoodSubmit(e) {
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
    const imageFile = document.getElementById('foodImageFile').files[0];
    const imageUrl = imageFile ? await fileToBase64(imageFile) : (id ? undefined : 'https://via.placeholder.com/400x250?text=Yemek');
    
    if (id) {
        db.updateFood(parseInt(id), name, desc, price, imageUrl);
        alert('✅ Yemek güncellendi!');
    } else {
        db.addFood(restaurantId, name, desc, price, imageUrl);
        alert('✅ Yemek eklendi!');
    }
    
    e.target.reset();
    document.getElementById('foodId').value = '';
    document.getElementById('cancelFoodEditBtn').style.display = 'none';
    renderFoodTable();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
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
    const updatedOrder = db.getOrders().find(o => o.id === orderId);
    if (updatedOrder) {
        if (status === 'Onaylandı' || status === 'Teslim Edildi') {
            const message = status === 'Onaylandı'
                ? `Siparişiniz ${orderId} onaylandı. Restorant hazırlık yapıyor.`
                : `Siparişiniz ${orderId} teslim edildi. Afiyet olsun!`;
            sendNotification(`✅ Sipariş ${status}`, message, 'customer', updatedOrder.userId, orderId);
        }
    }
    alert('✅ Sipariş durumu güncellendi!');
    renderOrderTable();
}
