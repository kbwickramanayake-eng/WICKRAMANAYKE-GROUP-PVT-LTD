document.addEventListener('DOMContentLoaded', () => {
    if (!appState.data.currentUser || appState.data.currentUser.type !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    let selectedReportMonth = new Date().toISOString().slice(0, 7); 
    let adminCurrentOrderItems = [];

    function renderAdminDashboard() {
        document.getElementById('stat-reps').textContent = appState.data.reps.length;
        document.getElementById('stat-shops').textContent = appState.data.shops.length;
        document.getElementById('stat-items').textContent = appState.data.items.length;
        
        const tbody = document.getElementById('dashboard-recent-activity');
        tbody.innerHTML = '';
        const recentActivities = appState.data.activities.slice(0, 5);
        if(recentActivities.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-gray-400">No recent activity</td></tr>`;
            return;
        }
        recentActivities.forEach(act => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="py-3 pl-2"><span class="font-medium text-gray-800">${act.repName}</span></td>
                <td class="py-3 text-gray-600">${act.shopName}</td>
                <td class="py-3 text-right font-bold text-green-600">${formatCurrency(act.totalSale)}</td>
                <td class="py-3 text-gray-500 text-xs text-right pr-2">${formatDate(act.timestamp)}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderOperations(filter = '') {
        const list = document.getElementById('operations-shops-list');
        list.innerHTML = '';
        const filteredShops = appState.data.shops.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.address.toLowerCase().includes(filter.toLowerCase()));
        
        if(filteredShops.length === 0) {
            list.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border">No shops found.</div>`;
            return;
        }

        filteredShops.forEach(shop => {
            const outstanding = shop.outstanding || 0;
            const card = document.createElement('div');
            card.className = `rounded-2xl border transition-all bg-white hover:border-blue-300 cursor-pointer shadow-sm overflow-hidden flex flex-col group`;
            card.onclick = () => openShopDetailModal(shop.id);
            
            card.innerHTML = `
                <div class="relative w-full h-32 bg-gray-100 overflow-hidden">
                    <img src="default_shop.png" alt="Shop exterior" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='https://via.placeholder.com/400x200/e2e8f0/64748b?text=Shop'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    <div class="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                        <div class="text-white">
                            <h3 class="font-bold text-lg leading-tight">${shop.name}</h3>
                            <p class="text-xs text-gray-300 line-clamp-1"><i class="fa-solid fa-phone text-[10px] mr-1"></i>${shop.contact || 'No contact'}</p>
                        </div>
                    </div>
                    <div class="absolute top-2 left-2 text-white/90 text-[8px] font-bold tracking-widest uppercase drop-shadow-md backdrop-blur-sm bg-black/40 px-2 py-0.5 rounded border border-white/20">WICKRAMANAYAKE GROUP (PVT) LTD.</div>
                </div>
                <div class="p-4 bg-white border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Balance to take</p>
                        <p class="font-bold ${outstanding > 0 ? 'text-red-600' : 'text-green-600'} text-xl leading-none">${formatCurrency(outstanding)}</p>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 flex flex-wrap gap-2">
                    <div class="flex-1 text-center py-2 text-blue-600 font-bold text-xs uppercase tracking-widest"><i class="fa-solid fa-arrow-up-right-from-square mr-1"></i> View Details</div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    document.getElementById('search-operations').addEventListener('input', (e) => renderOperations(e.target.value));

    function renderStockReports(filter = '') {
        const container = document.getElementById('stock-reports-list');
        container.innerHTML = '';
        
        const filteredShops = appState.data.shops.filter(s => 
            s.name.toLowerCase().includes(filter.toLowerCase()) || 
            s.address.toLowerCase().includes(filter.toLowerCase())
        );

        let totalItemsInField = 0;
        document.getElementById('stock-stat-shops').textContent = appState.data.shops.length;

        if(filteredShops.length === 0) {
            container.innerHTML = `<div class="py-12 text-center text-gray-400 bg-white rounded-2xl border">No shops matching your search.</div>`;
            return;
        }

        filteredShops.forEach(shop => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden";
            
            const inventory = shop.inventory || {};
            const itemIds = Object.keys(inventory).filter(id => inventory[id] > 0);
            
            let stockRows = '';
            if(itemIds.length === 0) {
                stockRows = `<tr><td colspan="3" class="p-6 text-center text-gray-400 italic">No stock currently held in this shop.</td></tr>`;
            } else {
                itemIds.forEach(itemId => {
                    const itemDef = appState.data.items.find(i => i.id === itemId);
                    const qty = inventory[itemId];
                    totalItemsInField += qty;
                    stockRows += `
                        <tr class="border-t border-gray-50">
                            <td class="p-3 font-medium text-gray-800">${itemDef ? itemDef.name : 'Unknown Item'}</td>
                            <td class="p-3 text-center font-bold text-blue-600">${qty}</td>
                            <td class="p-3 text-right text-gray-500 text-xs">${itemDef ? formatCurrency(itemDef.salePrice * qty) : '-'}</td>
                        </tr>
                    `;
                });
            }

            card.innerHTML = `
                <div class="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 class="font-bold text-gray-800">${shop.name}</h3>
                        <p class="text-xs text-gray-500">${shop.address}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Value in Shop</span>
                        <p class="font-bold text-green-600">${formatCurrency(calculateShopStockValue(shop))}</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-white text-gray-400 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th class="p-3">Item Name</th>
                                <th class="p-3 text-center">Qty in Shop</th>
                                <th class="p-3 text-right">Market Value</th>
                            </tr>
                        </thead>
                        <tbody>${stockRows}</tbody>
                    </table>
                </div>
            `;
            container.appendChild(card);
        });

        document.getElementById('stock-stat-items').textContent = totalItemsInField;
    }

    function calculateShopStockValue(shop) {
        let total = 0;
        const inventory = shop.inventory || {};
        Object.keys(inventory).forEach(itemId => {
            const itemDef = appState.data.items.find(i => i.id === itemId);
            if(itemDef) total += itemDef.salePrice * inventory[itemId];
        });
        return total;
    }

    document.getElementById('search-stock').addEventListener('input', (e) => renderStockReports(e.target.value));

    window.exportStockReportToPDF = () => {
        const element = document.getElementById('stock-reports-list');
        const opt = {
            margin:       0.5,
            filename:     `Stock_Report_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    function renderReps() {
        const list = document.getElementById('reps-list');
        list.innerHTML = '';
        if(appState.data.reps.length === 0) {
            list.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border">No refs added yet.</div>`;
            return;
        }
        appState.data.reps.forEach(rep => {
            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group";
            card.innerHTML = `
                <div class="relative w-full h-32 bg-gray-100 overflow-hidden">
                    <img src="default_shop.png" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="absolute top-2 left-2 text-white/90 text-[8px] font-bold tracking-widest uppercase drop-shadow-md backdrop-blur-sm bg-black/40 px-2 py-0.5 rounded border border-white/20">WICKRAMANAYAKE GROUP (PVT) LTD.</div>
                    <div class="absolute bottom-3 left-4 text-white">
                        <h3 class="font-bold text-xl leading-tight mb-1">${rep.name}</h3>
                        <span class="text-xs font-mono bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded border border-white/30"><i class="fa-solid fa-key text-[10px]"></i> ${rep.code}</span>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 flex gap-2">
                    <button onclick="editRep('${rep.id}')" class="flex-1 text-blue-600 bg-blue-100 hover:bg-blue-200 py-2 rounded-xl text-sm font-bold shadow-sm transition"><i class="fa-solid fa-pen text-xs"></i> Edit</button>
                    <button onclick="deleteRep('${rep.id}')" class="flex-1 text-red-600 bg-red-100 hover:bg-red-200 py-2 rounded-xl text-sm font-bold shadow-sm transition"><i class="fa-solid fa-trash text-xs"></i> Remove</button>
                </div>
            `;
            list.appendChild(card);
        });
    }

    window.exportShopsListPDF = () => {
        const shops = appState.data.shops;
        if(shops.length === 0) return showToast('No shops to export', 'error');

        const element = document.createElement('div');
        element.style.padding = '30px';
        element.style.fontFamily = 'Arial, sans-serif';
        
        let shopsHtml = shops.map(shop => {
            const assignedRef = appState.data.reps.find(r => r.id === shop.assignedRefId);
            return `
                <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 12px;">
                    <h2 style="margin: 0 0 10px 0; color: #1e40af;">${shop.name}</h2>
                    <p style="margin: 0; color: #4b5563; font-size: 14px;"><strong>Address:</strong> ${shop.address}</p>
                    <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;"><strong>Contact:</strong> ${shop.contact || 'N/A'}</p>
                    <p style="margin: 5px 0 0 0; color: #4b5563; font-size: 14px;"><strong>Assigned Ref:</strong> ${assignedRef ? assignedRef.name : 'Unassigned'}</p>
                    <p style="margin: 10px 0 0 0; color: #b91c1c; font-size: 16px; font-weight: bold;">Outstanding Balance: ${formatCurrency(shop.outstanding || 0)}</p>
                </div>
            `;
        }).join('');

        element.innerHTML = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #111827; margin: 0;">Shop Registry Report</h1>
                <p style="color: #6b7280; margin: 5px 0;">WICKRAMANAYAKE GROUP (PVT) LTD.</p>
                <p style="color: #9ca3af; font-size: 12px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            </div>
            ${shopsHtml}
        `;

        const opt = {
            margin:       0.5,
            filename:     `Shop_Registry_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save();
    };

    function renderShops(filter = '') {
        const list = document.getElementById('shops-list');
        list.innerHTML = '';
        const filteredShops = appState.data.shops.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.address.toLowerCase().includes(filter.toLowerCase()));
        if(filteredShops.length === 0) {
            list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-gray-400">No shops found.</td></tr>`;
            return;
        }
        filteredShops.forEach(shop => {
            const outstanding = shop.outstanding || 0;
            const assignedRef = appState.data.reps.find(r => r.id === shop.assignedRefId);
            const refNameHtml = assignedRef ? `<span class="text-xs font-mono bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded border border-white/30 ml-2"><i class="fa-solid fa-user-tie text-[10px]"></i> ${assignedRef.name}</span>` : `<span class="text-xs font-mono bg-white/20 backdrop-blur-md text-white px-2 py-0.5 rounded border border-white/30 ml-2">Unassigned</span>`;
            
            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group";
            card.innerHTML = `
                <div class="relative w-full h-32 bg-gray-100 overflow-hidden">
                    <img src="default_shop.png" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style="object-position: bottom;">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                    <div class="absolute top-2 left-2 text-white/90 text-[8px] font-bold tracking-widest uppercase drop-shadow-md backdrop-blur-sm bg-black/40 px-2 py-0.5 rounded border border-white/20">WICKRAMANAYAKE GROUP (PVT) LTD.</div>
                    <div class="absolute bottom-3 left-4 text-white">
                        <h3 class="font-bold text-xl leading-tight mb-1">${shop.name}</h3>
                        <p class="text-xs text-gray-300 line-clamp-1"><i class="fa-solid fa-map-marker-alt text-[10px] mr-1"></i>${shop.address} ${refNameHtml}</p>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 flex gap-2 border-t border-gray-100">
                    <button onclick="editShop('${shop.id}')" class="flex-1 text-blue-600 bg-blue-100 hover:bg-blue-200 py-2 rounded-xl text-sm font-bold shadow-sm transition"><i class="fa-solid fa-pen text-xs"></i> Edit</button>
                    <button onclick="deleteShop('${shop.id}')" class="flex-1 text-red-600 bg-red-100 hover:bg-red-200 py-2 rounded-xl text-sm font-bold shadow-sm transition"><i class="fa-solid fa-trash text-xs"></i> Remove</button>
                </div>
            `;
            list.appendChild(card);
        });
    }

    function renderItems() {
        const list = document.getElementById('items-list');
        list.innerHTML = '';
        if(appState.data.items.length === 0) {
            list.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border">No items added yet.</div>`;
            return;
        }
        appState.data.items.forEach(item => {
            const profit = (item.salePrice || 0) - (item.costPrice || 0);
            const imageSrc = item.imageUrl ? item.imageUrl : 'default_item.png';

            const card = document.createElement('div');
            card.className = "bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group";
            card.innerHTML = `
                <div class="relative w-full h-48 bg-gray-100 overflow-hidden">
                    <img src="${imageSrc}" alt="${item.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onerror="this.src='default_item.png'">
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div class="absolute bottom-2 left-2 text-white/90 text-[10px] font-bold tracking-widest uppercase drop-shadow-md backdrop-blur-sm bg-black/30 px-2 py-0.5 rounded border border-white/20">WICKRAMANAYAKE GROUP (PVT) LTD.</div>
                    <div class="absolute top-2 right-2 flex gap-1">
                        <button onclick="editItem('${item.id}')" class="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-blue-600 shadow-sm flex items-center justify-center transition-colors"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="deleteItem('${item.id}')" class="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-red-600 shadow-sm flex items-center justify-center transition-colors"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                </div>
                <div class="p-5 flex-1 flex flex-col">
                    <h3 class="font-bold text-gray-800 text-lg leading-tight mb-3">${item.name}</h3>
                    <div class="flex justify-between text-sm mb-1">
                        <span class="text-gray-500">Cost:</span>
                        <span class="font-semibold text-orange-700">${formatCurrency(item.costPrice)}</span>
                    </div>
                    <div class="flex justify-between text-sm mb-3">
                        <span class="text-gray-500">Sale:</span>
                        <span class="font-bold text-green-700">${formatCurrency(item.salePrice)}</span>
                    </div>
                    <div class="mt-auto pt-3 border-t border-gray-100 flex justify-between items-center">
                        <span class="text-xs text-gray-500 uppercase font-semibold">Margin</span>
                        <span class="text-sm font-bold text-emerald-600">${formatCurrency(profit)}</span>
                    </div>
                </div>
            `;
            list.appendChild(card);
        });
    }

    function renderActivities() {
        const timeline = document.getElementById('activity-timeline');
        timeline.innerHTML = '';
        if(appState.data.activities.length === 0) {
            timeline.innerHTML = `<div class="text-center py-8 text-gray-400">No activities recorded yet.</div>`;
            return;
        }
        appState.data.activities.forEach(act => {
            const item = document.createElement('div');
            item.className = "timeline-item relative pl-6 flex flex-col gap-4";
            
            let itemsHtml = '';
            if(act.items && act.items.length > 0) {
                itemsHtml = `<div class="mt-3 text-xs bg-white rounded border overflow-hidden">
                    <table class="w-full text-left">
                        <tr class="bg-gray-50 text-gray-500"><th class="p-1 px-2">Item</th><th class="p-1 text-right">Qty</th><th class="p-1 text-right px-2">Subtotal</th></tr>
                        ${act.items.map(i => `<tr><td class="p-1 px-2 border-t">${i.name}</td><td class="p-1 text-right border-t">${i.qty}</td><td class="p-1 text-right px-2 border-t font-medium text-green-700">${formatCurrency(i.salePrice * i.qty)}</td></tr>`).join('')}
                    </table>
                </div>`;
            }

            // Distinguish actions
            let titleHtml = "";
            if (act.repId === 'admin') {
                if (act.totalSale < 0) {
                    titleHtml = `<span class="text-green-600"><i class="fa-solid fa-hand-holding-dollar"></i> Admin collected from</span> ${act.shopName}`;
                } else {
                    titleHtml = `<span class="text-blue-600"><i class="fa-solid fa-box-open"></i> Admin delivered to</span> ${act.shopName}`;
                }
            } else {
                titleHtml = `<span class="text-gray-800">${act.repName} visited</span> <span class="text-green-600">${act.shopName}</span>`;
            }

            item.innerHTML = `
                <div class="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                    <div class="flex justify-between items-start mb-2">
                        <h4 class="font-bold text-gray-800">${titleHtml}</h4>
                        <span class="text-xs font-semibold text-gray-500 bg-white px-2 py-1 rounded border">${formatDate(act.timestamp)}</span>
                    </div>
                    ${act.notes ? `<div class="text-sm text-gray-600 bg-white p-3 rounded-xl border mb-2">${act.notes}</div>` : ''}
                    ${itemsHtml}
                    <div class="mt-3 flex justify-between items-center text-sm font-bold">
                        <span class="text-gray-500">${act.totalSale < 0 ? 'Amount Collected:' : 'Delivery / Order Value:'}</span>
                        <span class="${act.totalSale < 0 ? 'text-green-600' : 'text-blue-600'} text-lg">${formatCurrency(Math.abs(act.totalSale))}</span>
                    </div>
                </div>
            `;
            timeline.appendChild(item);
        });
    }

    function switchAdminTab(targetId) {
        document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.remove('active', 'bg-green-50/50');
            const icon = l.querySelector('i');
            const span = l.querySelector('span');
            icon.classList.replace('text-green-600', 'text-gray-600');
            span.classList.remove('text-green-800');
        });
        
        document.getElementById(targetId).style.display = 'block';
        
        const activeLink = document.querySelector(`[data-target="${targetId}"]`);
        activeLink.classList.add('active', 'bg-green-50/50');
        const activeIcon = activeLink.querySelector('i');
        const activeSpan = activeLink.querySelector('span');
        if(activeIcon.classList.contains('text-gray-600')) activeIcon.classList.replace('text-gray-600', 'text-green-600');
        activeSpan.classList.add('text-green-800');

        if(targetId === 'admin-reports') renderStockReports();
        if(targetId === 'admin-operations') renderOperations();
    }

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); switchAdminTab(link.getAttribute('data-target')); });
    });

    document.querySelector('.logout-btn').addEventListener('click', () => {
        appState.logout();
        window.location.href = 'index.html';
    });

    // Admin Take Money Logic
    window.openAdminTakeMoneyModal = (shopId) => {
        const shop = appState.data.shops.find(s => s.id === shopId);
        if(!shop) return;
        
        document.getElementById('admin-take-shop-id').value = shop.id;
        document.getElementById('admin-take-shop-name').textContent = shop.name;
        document.getElementById('admin-take-shop-outstanding').textContent = formatCurrency(shop.outstanding || 0);
        document.getElementById('admin-take-payment').value = '';
        document.getElementById('admin-take-notes').value = '';
        
        openModal('admin-take-money-modal');
    };

    window.submitAdminCollection = () => {
        const shopId = document.getElementById('admin-take-shop-id').value;
        const shop = appState.data.shops.find(s => s.id === shopId);
        const paymentInput = document.getElementById('admin-take-payment').value;
        const notes = document.getElementById('admin-take-notes').value.trim();
        
        const paymentAmount = Number(paymentInput) || 0;

        if(paymentAmount <= 0) {
            showToast('Please enter a valid payment amount.', 'error');
            return;
        }

        appState.logOrder(
            'admin', 
            'Administrator', 
            shopId, 
            shop.name, 
            [], 
            0, 
            -paymentAmount, 
            0, 
            notes || `Admin collected payment of ${formatCurrency(paymentAmount)}`
        );
        
        closeModal('admin-take-money-modal');
        showToast('Payment collected and balance updated successfully!');
        renderOperations(document.getElementById('search-operations').value);
        renderShops(document.getElementById('search-shops').value);
        renderActivities();
        renderAdminDashboard();
    };

    // Admin Deliver Items Logic
    window.openDeliverModal = (shopId) => {
        const shop = appState.data.shops.find(s => s.id === shopId);
        if(!shop) return;
        
        document.getElementById('deliver-shop-id').value = shop.id;
        document.getElementById('deliver-shop-name').textContent = shop.name;
        document.getElementById('deliver-shop-outstanding').textContent = formatCurrency(shop.outstanding || 0);
        document.getElementById('deliver-notes').value = '';
        
        adminCurrentOrderItems = [];
        
        const selector = document.getElementById('deliver-item-selector');
        selector.innerHTML = '<option value="">-- Select an Item --</option>';
        appState.data.items.forEach(item => {
            selector.innerHTML += `<option value="${item.id}">${item.name} (${formatCurrency(item.salePrice)})</option>`;
        });

        renderAdminOrderItems();
        openModal('deliver-modal');
    };

    document.getElementById('btn-admin-add-item').addEventListener('click', () => {
        const selector = document.getElementById('deliver-item-selector');
        const qtyInput = document.getElementById('deliver-item-qty');
        
        const itemId = selector.value;
        const qty = parseInt(qtyInput.value);
        
        if(!itemId || isNaN(qty) || qty <= 0) return showToast('Select item and valid quantity', 'error');

        const itemDef = appState.data.items.find(i => i.id === itemId);
        if(itemDef) {
            const existing = adminCurrentOrderItems.find(i => i.itemId === itemId);
            if(existing) existing.qty += qty;
            else adminCurrentOrderItems.push({
                itemId: itemDef.id, name: itemDef.name, qty: qty,
                costPrice: itemDef.costPrice || 0, salePrice: itemDef.salePrice || 0
            });
            selector.value = ''; qtyInput.value = 1;
            renderAdminOrderItems();
        }
    });

    window.removeAdminOrderItem = (index) => {
        adminCurrentOrderItems.splice(index, 1);
        renderAdminOrderItems();
    };

    function renderAdminOrderItems() {
        const tbody = document.getElementById('admin-order-items-list');
        tbody.innerHTML = '';
        let total = 0;

        if(adminCurrentOrderItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">No items added yet.</td></tr>`;
            document.getElementById('admin-order-total').textContent = formatCurrency(0);
            return;
        }

        adminCurrentOrderItems.forEach((item, index) => {
            const subtotal = item.salePrice * item.qty;
            total += subtotal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-medium">${item.name}</td>
                <td class="p-3 text-center">${item.qty}</td>
                <td class="p-3 text-right font-bold text-gray-700">${formatCurrency(subtotal)}</td>
                <td class="p-3 text-right"><button type="button" onclick="removeAdminOrderItem(${index})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('admin-order-total').textContent = formatCurrency(total);
    }

    window.submitAdminDelivery = () => {
        const shopId = document.getElementById('deliver-shop-id').value;
        const shop = appState.data.shops.find(s => s.id === shopId);
        const notes = document.getElementById('deliver-notes').value.trim();
        
        if(adminCurrentOrderItems.length === 0) return showToast('Please add items to deliver.', 'error');

        let totalSale = 0, totalCost = 0;
        adminCurrentOrderItems.forEach(item => {
            totalSale += item.salePrice * item.qty;
            totalCost += item.costPrice * item.qty;
        });
        
        appState.logOrder(
            'admin', 
            'Administrator', 
            shopId, 
            shop.name, 
            adminCurrentOrderItems, 
            totalCost, 
            totalSale, 
            totalSale - totalCost, 
            notes || 'Delivered items to shop'
        );
        
        closeModal('deliver-modal');
        showToast('Items delivered! Outstanding balance updated.');
        renderOperations(document.getElementById('search-operations').value);
        renderShops(document.getElementById('search-shops').value);
        renderActivities();
        renderAdminDashboard();
    };

    // Admin Return Items Logic
    let adminCurrentReturnItems = [];

    window.openReturnModal = (shopId) => {
        const shop = appState.data.shops.find(s => s.id === shopId);
        if(!shop) return;
        
        document.getElementById('return-shop-id').value = shop.id;
        document.getElementById('return-shop-name').textContent = shop.name;
        document.getElementById('return-shop-outstanding').textContent = formatCurrency(shop.outstanding || 0);
        document.getElementById('return-notes').value = '';
        document.getElementById('return-auth-code').value = '';
        
        adminCurrentReturnItems = [];
        
        const selector = document.getElementById('return-item-selector');
        selector.innerHTML = '<option value="">-- Select Item to Return --</option>';
        appState.data.items.forEach(item => {
            selector.innerHTML += `<option value="${item.id}">${item.name} (${formatCurrency(item.salePrice)})</option>`;
        });

        renderAdminReturnItems();
        openModal('return-modal');
    };

    document.getElementById('btn-admin-add-return-item').addEventListener('click', () => {
        const selector = document.getElementById('return-item-selector');
        const qtyInput = document.getElementById('return-item-qty');
        
        const itemId = selector.value;
        const qty = parseInt(qtyInput.value);
        
        if(!itemId || isNaN(qty) || qty <= 0) return showToast('Select item and valid quantity', 'error');

        const itemDef = appState.data.items.find(i => i.id === itemId);
        if(itemDef) {
            const existing = adminCurrentReturnItems.find(i => i.itemId === itemId);
            if(existing) existing.qty += qty;
            else adminCurrentReturnItems.push({
                itemId: itemDef.id, name: itemDef.name, qty: qty,
                costPrice: itemDef.costPrice || 0, salePrice: itemDef.salePrice || 0
            });
            selector.value = ''; qtyInput.value = 1;
            renderAdminReturnItems();
        }
    });

    window.removeAdminReturnItem = (index) => {
        adminCurrentReturnItems.splice(index, 1);
        renderAdminReturnItems();
    };

    function renderAdminReturnItems() {
        const tbody = document.getElementById('admin-return-items-list');
        tbody.innerHTML = '';
        let total = 0;

        if(adminCurrentReturnItems.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">No items added yet.</td></tr>`;
            document.getElementById('admin-return-total').textContent = formatCurrency(0);
            return;
        }

        adminCurrentReturnItems.forEach((item, index) => {
            const subtotal = item.salePrice * item.qty;
            total += subtotal;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="p-3 font-medium">${item.name}</td>
                <td class="p-3 text-center">${item.qty}</td>
                <td class="p-3 text-right font-bold text-gray-700">${formatCurrency(subtotal)}</td>
                <td class="p-3 text-right"><button type="button" onclick="removeAdminReturnItem(${index})" class="text-red-400 hover:text-red-600"><i class="fa-solid fa-xmark"></i></button></td>
            `;
            tbody.appendChild(tr);
        });

        document.getElementById('admin-return-total').textContent = formatCurrency(total);
    }

    window.submitAdminReturn = () => {
        const shopId = document.getElementById('return-shop-id').value;
        const shop = appState.data.shops.find(s => s.id === shopId);
        const notes = document.getElementById('return-notes').value.trim();
        const authCode = document.getElementById('return-auth-code').value.trim();
        
        if(authCode !== "8855") {
            showToast('Invalid Return Authorization Code!', 'error');
            return;
        }

        if(adminCurrentReturnItems.length === 0) return showToast('Please add items to return.', 'error');

        let totalSale = 0, totalCost = 0;
        adminCurrentReturnItems.forEach(item => {
            totalSale += item.salePrice * item.qty;
            totalCost += item.costPrice * item.qty;
        });
        
        // Pass negative values for return
        appState.logOrder(
            'admin', 
            'Administrator', 
            shopId, 
            shop.name, 
            adminCurrentReturnItems.map(i => ({...i, qty: -i.qty})), // Negative qty for activity log
            -totalCost, 
            -totalSale, 
            -(totalSale - totalCost), 
            notes || 'Items returned by shop'
        );
        
        closeModal('return-modal');
        showToast('Items returned successfully! Balance updated.');
        renderOperations(document.getElementById('search-operations').value);
        renderShops(document.getElementById('search-shops').value);
        renderActivities();
        renderAdminDashboard();
    };

    window.exportReportToPDF = () => {
        const element = document.getElementById('admin-reports');
        const opt = {
            margin:       0.5,
            filename:     `Monthly_Report_${selectedReportMonth}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        // Hide buttons temporarily for clean PDF
        const buttons = element.querySelectorAll('button');
        buttons.forEach(b => b.style.display = 'none');
        
        html2pdf().set(opt).from(element).save().then(() => {
            buttons.forEach(b => b.style.display = 'flex');
        });
    };

    window.clearMonthlyReport = () => {
        if (!confirm(`Are you sure you want to PERMANENTLY clear all reports and activities for ${selectedReportMonth}? This cannot be undone.`)) return;
        
        appState.data.activities = appState.data.activities.filter(a => !a.timestamp.startsWith(selectedReportMonth));
        appState.save();
        
        showToast(`Reports for ${selectedReportMonth} cleared.`);
        renderReports();
        renderActivities();
        renderAdminDashboard();
    };

    // Shop History Logic (DEPRECATED - Moved to Detail Modal)
    window.openShopHistoryModal = (shopId) => {
        openShopDetailModal(shopId);
        switchShopDetailTab('detail-history');
    };

    // Shop Detail Modal Logic
    let currentActiveShopId = null;

    window.openShopDetailModal = (shopId) => {
        const shop = appState.data.shops.find(s => s.id === shopId);
        if(!shop) return;
        
        currentActiveShopId = shopId;
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
            tbody.innerHTML = `<tr><td colspan="3" class="p-8 text-center text-gray-400 italic">No stock in shop.</td></tr>`;
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
            container.innerHTML = `<div class="text-center py-12 text-gray-400">No history found.</div>`;
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
        const shop = appState.data.shops.find(s => s.id === currentActiveShopId);
        const element = document.getElementById('shop-detail-modal').querySelector('.bg-white');
        
        // Hide buttons for PDF
        const buttons = element.querySelectorAll('button');
        buttons.forEach(b => b.style.display = 'none');
        
        const opt = {
            margin:       0.2,
            filename:     `${shop.name}_Report_${new Date().toISOString().slice(0,10)}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        
        html2pdf().set(opt).from(element).save().then(() => {
            buttons.forEach(b => b.style.display = 'inline-flex');
        });
    };

    // Forms
    document.getElementById('rep-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('rep-id').value;
        const name = document.getElementById('rep-name').value.trim();
        const code = document.getElementById('rep-code').value.trim();
        if(id) { appState.updateRep(id, name, code); showToast('Ref updated'); }
        else { appState.addRep(name, code); showToast('Ref added'); }
        closeModal('rep-modal');
        renderReps(); renderAdminDashboard();
    });

    window.editRep = (id) => {
        const rep = appState.data.reps.find(r => r.id === id);
        if(rep) {
            document.getElementById('rep-id').value = rep.id;
            document.getElementById('rep-name').value = rep.name;
            document.getElementById('rep-code').value = rep.code;
            document.getElementById('rep-modal-title').textContent = 'Edit Ref';
            openModal('rep-modal');
        }
    };
    window.deleteRep = (id) => { if(confirm('Delete Ref?')) { appState.deleteRep(id); renderReps(); renderAdminDashboard(); } };

    window.openShopModal = () => {
        document.getElementById('shop-modal-title').textContent = 'Add New Shop';
        const select = document.getElementById('shop-assigned-ref');
        select.innerHTML = '<option value="">-- Unassigned --</option>';
        appState.data.reps.forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
        });
        openModal('shop-modal');
    };

    document.getElementById('shop-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('shop-id').value;
        const name = document.getElementById('shop-name').value.trim();
        const address = document.getElementById('shop-address').value.trim();
        const contact = document.getElementById('shop-contact').value.trim();
        const outstanding = document.getElementById('shop-outstanding').value;
        const assignedRefId = document.getElementById('shop-assigned-ref').value;
        
        if(id) appState.updateShop(id, name, address, contact, outstanding, assignedRefId);
        else appState.addShop(name, address, contact, outstanding, assignedRefId);
        
        closeModal('shop-modal');
        renderShops(); renderOperations(); renderAdminDashboard();
    });

    window.editShop = (id) => {
        const shop = appState.data.shops.find(s => s.id === id);
        if(shop) {
            document.getElementById('shop-id').value = shop.id;
            document.getElementById('shop-name').value = shop.name;
            document.getElementById('shop-address').value = shop.address;
            document.getElementById('shop-contact').value = shop.contact || '';
            document.getElementById('shop-outstanding').value = shop.outstanding || 0;
            
            const select = document.getElementById('shop-assigned-ref');
            select.innerHTML = '<option value="">-- Unassigned --</option>';
            appState.data.reps.forEach(r => {
                select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
            });
            select.value = shop.assignedRefId || '';
            
            document.getElementById('shop-modal-title').textContent = 'Edit Shop';
            openModal('shop-modal');
        }
    };
    window.deleteShop = (id) => { if(confirm('Delete Shop?')) { appState.deleteShop(id); renderShops(); renderOperations(); renderAdminDashboard(); } };

    document.getElementById('search-shops').addEventListener('input', (e) => renderShops(e.target.value));

    document.getElementById('item-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('item-id').value;
        const name = document.getElementById('item-name').value.trim();
        const cost = document.getElementById('item-cost').value;
        const price = document.getElementById('item-price').value;
        const desc = document.getElementById('item-desc').value.trim();
        const image = document.getElementById('item-image').value.trim();
        
        if(id) appState.updateItem(id, name, cost, price, desc, image);
        else appState.addItem(name, cost, price, desc, image);
        
        closeModal('item-modal');
        renderItems(); renderAdminDashboard();
    });

    window.editItem = (id) => {
        const item = appState.data.items.find(i => i.id === id);
        if(item) {
            document.getElementById('item-id').value = item.id;
            document.getElementById('item-name').value = item.name;
            document.getElementById('item-cost').value = item.costPrice || 0;
            document.getElementById('item-price').value = item.salePrice || 0;
            document.getElementById('item-desc').value = item.desc || '';
            document.getElementById('item-image').value = item.imageUrl || '';
            document.getElementById('item-modal-title').textContent = 'Edit Item';
            openModal('item-modal');
        }
    };
    window.deleteItem = (id) => { if(confirm('Delete Item?')) { appState.deleteItem(id); renderItems(); renderAdminDashboard(); } };

    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById('admin-dashboard').style.display = 'block';
    
    // Initial Render
    renderAdminDashboard();
    renderReps();
    renderShops();
    renderOperations();
    renderItems();
    renderActivities();
    renderStockReports();
});
