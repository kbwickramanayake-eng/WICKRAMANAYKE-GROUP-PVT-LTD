document.addEventListener('DOMContentLoaded', () => {
    if (!appState.data.currentUser || appState.data.currentUser.type !== 'rep') {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('rep-welcome-name').textContent = `Hello, ${appState.data.currentUser.name}`;

    function renderRepShops(filter = '') {
        const list = document.getElementById('rep-shops-list');
        list.innerHTML = '';
        
        const myShops = appState.data.shops.filter(s => s.assignedRefId === appState.data.currentUser.id);
        
        const filteredShops = myShops.filter(s => 
            s.name.toLowerCase().includes(filter.toLowerCase()) || 
            s.address.toLowerCase().includes(filter.toLowerCase())
        );

        if(filteredShops.length === 0) {
            list.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400">No assigned shops found.</div>`;
            return;
        }

        filteredShops.forEach(shop => {
            const outstanding = shop.outstanding || 0;
            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:border-green-300 transition-all cursor-pointer group";
            card.onclick = () => openShopDetailModal(shop.id);
            
            card.innerHTML = `
                <div class="relative w-full h-32 bg-gray-100 overflow-hidden">
                    <img src="default_shop.png" alt="Shop exterior" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://via.placeholder.com/400x200/e2e8f0/64748b?text=Shop'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div class="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                        <div class="text-white">
                            <h3 class="font-bold text-lg leading-tight">${shop.name}</h3>
                            <p class="text-xs text-gray-300 line-clamp-1">${shop.address}</p>
                        </div>
                        <div class="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center border border-white/30">
                            <i class="fa-solid fa-chevron-right text-sm"></i>
                        </div>
                    </div>
                    <div class="absolute top-2 left-2 text-white/90 text-[8px] font-bold tracking-widest uppercase drop-shadow-md backdrop-blur-sm bg-black/40 px-2 py-0.5 rounded">WICKRAMANAYAKE GROUP (PVT) LTD.</div>
                </div>
                <div class="p-4 bg-white flex flex-col gap-3">
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance to take</p>
                            <p class="font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'} text-lg leading-none">${formatCurrency(outstanding)}</p>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <div class="flex-1 text-center py-2 text-green-600 font-bold text-[10px] uppercase tracking-widest"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> View Details</div>
                        </div>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    document.getElementById('rep-search-shops').addEventListener('input', (e) => renderRepShops(e.target.value));

    window.openVisitModal = (shop) => {
        document.getElementById('visit-shop-id').value = shop.id;
        document.getElementById('visit-shop-name').textContent = shop.name;
        document.getElementById('visit-shop-contact').textContent = shop.contact || 'No Contact Provided';
        document.getElementById('visit-shop-outstanding').textContent = formatCurrency(shop.outstanding || 0);
        document.getElementById('visit-payment').value = '';
        document.getElementById('visit-notes').value = '';
        
        openModal('visit-modal');
    };

    window.submitCollection = () => {
        const shopId = document.getElementById('visit-shop-id').value;
        const shopName = document.getElementById('visit-shop-name').textContent;
        const paymentInput = document.getElementById('visit-payment').value;
        const notes = document.getElementById('visit-notes').value.trim();
        
        const paymentAmount = Number(paymentInput) || 0;

        if(paymentAmount <= 0 && notes === '') {
            showToast('Please enter a payment amount or visit notes.', 'error');
            return;
        }

        // Passing negative payment to decrease outstanding balance in appState.logOrder
        appState.logOrder(
            appState.data.currentUser.id, 
            appState.data.currentUser.name, 
            shopId, 
            shopName, 
            [], // No items, just collection
            0, // Cost
            -paymentAmount, // Negative sale reduces outstanding
            0, // No gain
            notes || `Collected payment of ${formatCurrency(paymentAmount)}`
        );
        
        closeModal('visit-modal');
        showToast('Visit & Payment recorded successfully!');
        renderRepShops(document.getElementById('rep-search-shops').value);
    };

    document.querySelector('.logout-btn').addEventListener('click', () => {
        appState.logout();
        window.location.href = 'index.html';
    });

    // Ref Return Logic
    let refCurrentReturnItems = [];

    window.openRefReturnModal = (shop) => {
        document.getElementById('return-shop-id').value = shop.id;
        document.getElementById('return-shop-name').textContent = shop.name;
        document.getElementById('return-shop-outstanding').textContent = formatCurrency(shop.outstanding || 0);
        document.getElementById('return-notes').value = '';
        document.getElementById('return-auth-code').value = '';
        
        refCurrentReturnItems = [];
        
        const selector = document.getElementById('return-item-selector');
        selector.innerHTML = '<option value="">-- Select Item --</option>';
        appState.data.items.forEach(item => {
            selector.innerHTML += `<option value="${item.id}">${item.name} (${formatCurrency(item.salePrice)})</option>`;
        });

        renderRefReturnItems();
        openModal('return-modal');
    };

    document.getElementById('btn-ref-add-return').addEventListener('click', () => {
        const selector = document.getElementById('return-item-selector');
        const qtyInput = document.getElementById('return-item-qty');
        
        const itemId = selector.value;
        const qty = parseInt(qtyInput.value);
        
        if(!itemId || isNaN(qty) || qty <= 0) return showToast('Select item and valid quantity', 'error');

        const itemDef = appState.data.items.find(i => i.id === itemId);
        if(itemDef) {
            const existing = refCurrentReturnItems.find(i => i.itemId === itemId);
            if(existing) existing.qty += qty;
            else refCurrentReturnItems.push({
                itemId: itemDef.id, name: itemDef.name, qty: qty,
                costPrice: itemDef.costPrice || 0, salePrice: itemDef.salePrice || 0
            });
            selector.value = ''; qtyInput.value = 1;
            renderRefReturnItems();
        }
    });

    window.removeRefReturnItem = (index) => {
        refCurrentReturnItems.splice(index, 1);
        renderRefReturnItems();
    };

    function renderRefReturnItems() {
        const tbody = document.getElementById('ref-return-list');
        tbody.innerHTML = '';
        let total = 0;

        if(refCurrentReturnItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-4 text-center text-gray-400">No items.</td></tr>`;
            document.getElementById('ref-return-total').textContent = formatCurrency(0);
            return;
        }

        refCurrentReturnItems.forEach((item, index) => {
            const subtotal = item.salePrice * item.qty;
            total += subtotal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-2 font-medium">${item.name}</td>
                <td class="p-2 text-center">${item.qty}</td>
                <td class="p-2 text-right"><button type="button" onclick="removeRefReturnItem(${index})" class="text-red-400"><i class="fa-solid fa-trash-can"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('ref-return-total').textContent = formatCurrency(total);
    }

    window.submitRefReturn = () => {
        const shopId = document.getElementById('return-shop-id').value;
        const shopName = document.getElementById('return-shop-name').textContent;
        const notes = document.getElementById('return-notes').value.trim();
        const authCode = document.getElementById('return-auth-code').value.trim();
        
        if(authCode !== "8855") {
            showToast('Invalid Return Authorization Code!', 'error');
            return;
        }

        if(refCurrentReturnItems.length === 0) return showToast('Please add items to return.', 'error');

        let totalSale = 0, totalCost = 0;
        refCurrentReturnItems.forEach(item => {
            totalSale += item.salePrice * item.qty;
            totalCost += item.costPrice * item.qty;
        });
        
        appState.logOrder(
            appState.data.currentUser.id, 
            appState.data.currentUser.name, 
            shopId, 
            shopName, 
            refCurrentReturnItems.map(i => ({...i, qty: -i.qty})),
            -totalCost, 
            -totalSale, 
            -(totalSale - totalCost), 
            notes || 'Ref logged a return'
        );
        
        closeModal('return-modal');
        showToast('Return recorded successfully!');
        });
    }

    // Shop Detail Logic
    window.currentActiveShop = null;

    window.openShopDetailModal = (shopId) => {
        const shop = appState.data.shops.find(s => s.id === shopId);
        if(!shop) return;
        
        window.currentActiveShop = shop;
        document.getElementById('detail-shop-name').textContent = shop.name;
        document.getElementById('detail-shop-address').textContent = shop.address;
        document.getElementById('detail-shop-outstanding').textContent = formatCurrency(shop.outstanding || 0);
        
        // Stats
        const inventory = shop.inventory || {};
        let totalItems = 0;
        let totalValue = 0;
        Object.keys(inventory).forEach(id => {
            const qty = inventory[id];
            if (qty > 0) {
                totalItems += qty;
                const itemDef = appState.data.items.find(i => i.id === id);
                if (itemDef) totalValue += itemDef.salePrice * qty;
            }
        });
        
        document.getElementById('detail-shop-stock-count').textContent = totalItems;
        document.getElementById('detail-shop-stock-value').textContent = formatCurrency(totalValue);
        
        renderShopDetailStock(shop);
        renderShopDetailHistory(shopId);
        switchShopDetailTab('detail-stock');
        
        openModal('shop-detail-modal');
    };

    window.switchShopDetailTab = (tabId) => {
        document.querySelectorAll('.shop-detail-tab-content').forEach(c => c.classList.add('hidden'));
        document.getElementById(tabId).classList.remove('hidden');
        
        // Update tab buttons
        document.getElementById('tab-btn-stock').className = tabId === 'detail-stock' ? 'px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-bold text-sm transition-all' : 'px-6 py-4 border-b-2 border-transparent text-gray-400 hover:text-gray-600 font-bold text-sm transition-all';
        document.getElementById('tab-btn-history').className = tabId === 'detail-history' ? 'px-6 py-4 border-b-2 border-blue-600 text-blue-600 font-bold text-sm transition-all' : 'px-6 py-4 border-b-2 border-transparent text-gray-400 hover:text-gray-600 font-bold text-sm transition-all';
    };

    function renderShopDetailStock(shop) {
        const tbody = document.getElementById('detail-stock-list');
        tbody.innerHTML = '';
        
        const inventory = shop.inventory || {};
        const itemIds = Object.keys(inventory).filter(id => inventory[id] > 0);
        
        if (itemIds.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-400 italic">No items currently in shop.</td></tr>`;
            return;
        }

        itemIds.forEach(id => {
            const itemDef = appState.data.items.find(i => i.id === id);
            const qty = inventory[id];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-4 font-medium text-gray-800">${itemDef ? itemDef.name : 'Unknown Item'}</td>
                <td class="p-4 text-center font-bold text-blue-600">${qty}</td>
                <td class="p-4 text-right font-bold text-gray-700">${itemDef ? formatCurrency(itemDef.salePrice * qty) : '-'}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderShopDetailHistory(shopId) {
        const container = document.getElementById('detail-history');
        container.innerHTML = '';
        
        const shopActivities = appState.data.activities.filter(a => a.shopId === shopId);
        
        if(shopActivities.length === 0) {
            container.innerHTML = `<div class="text-center py-12 text-gray-400">No transaction history found.</div>`;
            return;
        }

        shopActivities.forEach(act => {
            const div = document.createElement('div');
            div.className = "bg-white rounded-2xl p-5 border border-gray-100 shadow-sm";
            
            let itemsHtml = '';
            if(act.items && act.items.length > 0) {
                itemsHtml = `<div class="mt-3 text-[11px] bg-gray-50 rounded-lg border overflow-hidden">
                    <table class="w-full text-left">
                        <tr class="bg-gray-100/50 text-gray-500 font-bold uppercase"><th class="p-2">Item</th><th class="p-2 text-center">Qty</th><th class="p-2 text-right">Subtotal</th></tr>
                        ${act.items.map(i => `<tr><td class="p-2 border-t">${i.name}</td><td class="p-2 text-center border-t">${i.qty}</td><td class="p-2 text-right border-t font-bold">${formatCurrency(Math.abs(i.salePrice * i.qty))}</td></tr>`).join('')}
                    </table>
                </div>`;
            }

            let typeBadge = '';
            let valColor = 'text-blue-600';
            if (act.totalSale < 0) {
                if (act.items && act.items.length > 0) {
                    typeBadge = `<span class="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">RETURN</span>`;
                    valColor = 'text-red-600';
                } else {
                    typeBadge = `<span class="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">PAYMENT</span>`;
                    valColor = 'text-green-600';
                }
            } else {
                typeBadge = `<span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">DELIVERY</span>`;
            }

            div.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2">
                        ${typeBadge}
                        <span class="text-xs text-gray-400 font-bold">${formatDate(act.timestamp)}</span>
                    </div>
                    <p class="font-bold ${valColor} text-lg">${formatCurrency(Math.abs(act.totalSale))}</p>
                </div>
                <p class="text-sm font-bold text-gray-700">Logged by ${act.repName}</p>
                ${act.notes ? `<p class="text-xs text-gray-500 italic mt-1">"${act.notes}"</p>` : ''}
                ${itemsHtml}
            `;
            container.appendChild(div);
        });
    }

    window.exportShopPDF = () => {
        const element = document.getElementById('shop-detail-modal').querySelector('.bg-white');
        
        // Hide buttons for PDF
        const buttons = element.querySelectorAll('button');
        buttons.forEach(b => b.style.display = 'none');
        
        const opt = {
            margin:       0.2,
            filename:     `${window.currentActiveShop.name}_Report_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            buttons.forEach(b => b.style.display = 'inline-flex');
        });
    };

    renderRepShops();
});
