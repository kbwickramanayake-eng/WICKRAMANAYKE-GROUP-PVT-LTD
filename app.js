// app.js
// Shared State Management & Logic

const ADMIN_CODE = "8855Wickaramanayake";

const appState = {
    data: {
        reps: [],
        shops: [],
        items: [],
        activities: [], 
        currentUser: null 
    },
    
    init() {
        const storedData = localStorage.getItem('wg_data');
        if (storedData) {
            this.data = JSON.parse(storedData);
        } else {
            this.data = { reps: [], shops: [], items: [], activities: [], currentUser: null };
            this.save();
        }
    },
    
    save() {
        localStorage.setItem('wg_data', JSON.stringify(this.data));
    },

    loginAsAdmin() {
        this.data.currentUser = { type: 'admin', id: 'admin', name: 'Administrator' };
        this.save();
    },
    
    loginAsRep(code) {
        const rep = this.data.reps.find(r => r.code === code);
        if (rep) {
            this.data.currentUser = { type: 'rep', id: rep.id, name: rep.name };
            this.save();
            return true;
        }
        return false;
    },
    
    logout() {
        this.data.currentUser = null;
        this.save();
    },

    // CRUD Methods
    addRep(name, code) {
        const id = 'rep_' + Date.now();
        this.data.reps.push({ id, name, code, createdAt: new Date().toISOString() });
        this.save();
    },
    updateRep(id, name, code) {
        const rep = this.data.reps.find(r => r.id === id);
        if (rep) { rep.name = name; rep.code = code; this.save(); }
    },
    deleteRep(id) {
        this.data.reps = this.data.reps.filter(r => r.id !== id);
        this.save();
    },

    addShop(name, address, contact, outstanding = 0, assignedRefId = "") {
        const id = 'shop_' + Date.now();
        this.data.shops.push({ id, name, address, contact, outstanding: Number(outstanding), assignedRefId, allowedItems: [], createdAt: new Date().toISOString() });
        this.save();
    },
    updateShop(id, name, address, contact, outstanding, assignedRefId) {
        const shop = this.data.shops.find(s => s.id === id);
        if (shop) { 
            shop.name = name; 
            shop.address = address; 
            shop.contact = contact; 
            shop.outstanding = Number(outstanding);
            shop.assignedRefId = assignedRefId;
            this.save(); 
        }
    },
    assignItemsToShop(id, itemIdsArray) {
        const shop = this.data.shops.find(s => s.id === id);
        if (shop) {
            shop.allowedItems = itemIdsArray;
            this.save();
        }
    },
    deleteShop(id) {
        this.data.shops = this.data.shops.filter(s => s.id !== id);
        this.save();
    },

    addItem(name, costPrice, salePrice, desc, imageUrl) {
        const id = 'item_' + Date.now();
        this.data.items.push({ id, name, costPrice: Number(costPrice), salePrice: Number(salePrice), desc, imageUrl, createdAt: new Date().toISOString() });
        this.save();
    },
    updateItem(id, name, costPrice, salePrice, desc, imageUrl) {
        const item = this.data.items.find(i => i.id === id);
        if (item) { 
            item.name = name; 
            item.costPrice = Number(costPrice); 
            item.salePrice = Number(salePrice); 
            item.desc = desc; 
            item.imageUrl = imageUrl;
            this.save(); 
        }
    },
    deleteItem(id) {
        this.data.items = this.data.items.filter(i => i.id !== id);
        this.save();
    },

    logOrder(repId, repName, shopId, shopName, itemsArr, totalCost, totalSale, totalGain, notes) {
        const id = 'act_' + Date.now();
        this.data.activities.unshift({
            id, repId, repName, shopId, shopName, 
            items: itemsArr, 
            totalCost, totalSale, totalGain, notes,
            timestamp: new Date().toISOString()
        });
        
        const shop = this.data.shops.find(s => s.id === shopId);
        if(shop) {
            shop.outstanding = (shop.outstanding || 0) + totalSale;
        }

        this.save();
    },
    clearActivities() {
        this.data.activities = [];
        this.save();
    }
};

// UI Helpers
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    
    let icon = '<i class="fa-solid fa-circle-check text-green-500 text-xl"></i>';
    let bgColor = 'bg-white border-green-100';
    if(type === 'error') {
        icon = '<i class="fa-solid fa-circle-exclamation text-red-500 text-xl"></i>';
        bgColor = 'bg-white border-red-100';
    } else if(type === 'info') {
        icon = '<i class="fa-solid fa-circle-info text-blue-500 text-xl"></i>';
        bgColor = 'bg-white border-blue-100';
    }

    toast.className = `toast flex items-center gap-3 p-4 rounded-2xl shadow-lg border ${bgColor} min-w-[300px] pointer-events-auto`;
    toast.innerHTML = `
        ${icon}
        <div class="flex-1 text-sm font-medium text-gray-700">${message}</div>
        <button class="text-gray-400 hover:text-gray-600 transition-colors" onclick="this.parentElement.remove()">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    container.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modal-backdrop');
    if(!modal || !backdrop) return;
    
    backdrop.classList.remove('hidden');
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        backdrop.classList.add('show-animate');
        modal.classList.add('show-animate');
        modal.classList.remove('scale-95');
        modal.classList.add('scale-100');
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const backdrop = document.getElementById('modal-backdrop');
    if(!modal || !backdrop) return;
    
    backdrop.classList.remove('show-animate');
    modal.classList.remove('show-animate');
    modal.classList.remove('scale-100');
    modal.classList.add('scale-95');
    
    setTimeout(() => {
        backdrop.classList.add('hidden');
        modal.classList.add('hidden');
        
        const form = modal.querySelector('form');
        if(form) form.reset();
        
        const hiddenInput = modal.querySelector('input[type="hidden"]');
        if(hiddenInput) hiddenInput.value = '';
    }, 300);
}

function generateRandomCode(inputId) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById(inputId);
    if(input) input.value = code;
}

function formatDate(isoString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(isoString).toLocaleDateString('en-US', options);
}

function formatCurrency(amount) {
    return Number(amount || 0).toLocaleString('en-US', { style: 'currency', currency: 'LKR', minimumFractionDigits: 2 });
}

// Global initialization
appState.init();
