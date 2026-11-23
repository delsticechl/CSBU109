const API_URL = 'http://localhost:5001/api/v1/products';

const errorBox = document.getElementById('errorBox');
const filterSelect = document.getElementById('categoryFilter');
const tbody = document.querySelector('#productTable tbody');

let products = [];     // last list received from the backend
let editingId = null;  // id of the row currently in edit mode

// ---------- Helpers ----------
function showError(message) {
    errorBox.textContent = message;
    errorBox.style.display = 'block';
}

function clearError() {
    errorBox.textContent = '';
    errorBox.style.display = 'none';
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// fetch() only rejects on network failure, so check response.ok ourselves
async function request(url, options) {
    const response = await fetch(url, options);
    let result = {};
    try {
        result = await response.json();
    } catch (_) { /* response had no JSON body */ }
    if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
    return result;
}

// ---------- Rendering ----------
function renderTable() {
    tbody.innerHTML = '';

    products.forEach(p => {
        const tr = document.createElement('tr');

        if (p.id === editingId) {
            tr.innerHTML = `
        <td>${p.id}</td>
        <td><input type="text" id="edit-name-${p.id}" value="${escapeHtml(p.name)}"></td>
        <td><input type="number" id="edit-price-${p.id}" value="${p.price}"></td>
        <td><input type="text" id="edit-category-${p.id}" value="${escapeHtml(p.category)}"></td>
        <td>
          <button class="btn-save" onclick="saveEdit(${p.id})">Save</button>
          <button class="btn-cancel" onclick="cancelEdit()">Cancel</button>
        </td>
      `;
        } else {
            tr.innerHTML = `
        <td>${p.id}</td>
        <td>${escapeHtml(p.name)}</td>
        <td>${new Intl.NumberFormat('en-US').format(p.price)} VND</td>
        <td>${escapeHtml(p.category)}</td>
        <td>
          <button class="btn-edit" onclick="startEdit(${p.id})">Edit</button>
          <button class="btn-delete" onclick="deleteProduct(${p.id})">Delete</button>
        </td>
      `;
        }
        tbody.appendChild(tr);
    });
}

// ---------- 1. Load the product list (with optional category filter) ----------
async function fetchProducts() {
    try {
        const category = filterSelect.value;
        const url = category ? `${API_URL}?category=${encodeURIComponent(category)}` : API_URL;
        const result = await request(url);

        products = result.data;
        editingId = null;
        renderTable();
        clearError();
    } catch (error) {
        showError(`Error fetching products: ${error.message}`);
    }
}

// Fill the dropdown with the distinct categories in the data
async function loadCategories() {
    try {
        const result = await request(`${API_URL}/categories`);
        const previous = filterSelect.value;

        filterSelect.innerHTML = '<option value="">All Categories</option>';
        result.data.forEach(c => {
            const option = document.createElement('option');
            option.value = c;
            option.textContent = c;
            filterSelect.appendChild(option);
        });

        // Keep the current selection if it still exists, otherwise fall back to "All"
        filterSelect.value = result.data.includes(previous) ? previous : '';
    } catch (error) {
        showError(`Error fetching categories: ${error.message}`);
    }
}

// Reload categories first (selection may change), then the table
async function refresh() {
    await loadCategories();
    await fetchProducts();
}

filterSelect.addEventListener('change', fetchProducts);

// ---------- 2. Add a new product ----------
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const productData = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        category: document.getElementById('category').value
    };

    try {
        await request(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
        });
        document.getElementById('productForm').reset();
        await refresh();
    } catch (error) {
        showError(`Error adding product: ${error.message}`);
    }
});

// ---------- 3. Delete a product ----------
async function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this?')) return;
    try {
        await request(`${API_URL}/${id}`, { method: 'DELETE' });
        await refresh();
    } catch (error) {
        showError(`Error deleting product: ${error.message}`);
    }
}

// ---------- 4. Update a product  ----------
function startEdit(id) {
    editingId = id;
    renderTable();
}

function cancelEdit() {
    editingId = null;
    renderTable();
}

async function saveEdit(id) {
    const name = document.getElementById(`edit-name-${id}`).value;
    const price = document.getElementById(`edit-price-${id}`).value;
    const category = document.getElementById(`edit-category-${id}`).value;

    try {
        await request(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, price, category })
        });
        await refresh(); // reload list + categories after a successful update
    } catch (error) {
        // Stay in edit mode so the user can fix the input
        showError(`Error updating product: ${error.message}`);
    }
}

refresh();
