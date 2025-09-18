// API Configuration
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const productsContainer = document.getElementById('products-container');
const productDetails = document.getElementById('product-details');
const cartItems = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const subtotalElement = document.getElementById('subtotal');
const taxElement = document.getElementById('tax');
const totalElement = document.getElementById('total');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const closeModal = document.querySelector('.close');
const registerLink = document.getElementById('register-link');

// State
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('user')) || null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateCartCount();
  
  if (window.location.pathname.includes('product.html')) {
    const productId = window.location.search.split('=')[1];
    fetchProductDetails(productId);
  } else if (window.location.pathname.includes('cart.html')) {
    displayCartItems();
  } else {
    fetchProducts();
  }
  
  // Event Listeners
  loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'block';
  });
  
  closeModal.addEventListener('click', () => {
    loginModal.style.display = 'none';
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = 'none';
    }
  });
  
  loginForm.addEventListener('submit', handleLogin);
  
  if (registerLink) {
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Redirect to register page or show register modal
      alert('Registration functionality would be implemented here');
    });
  }
  
  document.getElementById('cart-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = 'cart.html';
  });
  
  document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);
});

// Fetch Products
async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    const data = await response.json();
    
    if (data.success) {
      displayProducts(data.data);
    } else {
      productsContainer.innerHTML = '<p>Failed to load products</p>';
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    productsContainer.innerHTML = '<p>Error loading products</p>';
  }
}

// Display Products
function displayProducts(products) {
  productsContainer.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="price">$${product.price.toFixed(2)}</p>
        <button onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.image}')">
          Add to Cart
        </button>
      </div>
    </div>
  `).join('');
}

// Fetch Product Details
async function fetchProductDetails(productId) {
  try {
    const response = await fetch(`${API_URL}/products/${productId}`);
    const data = await response.json();
    
    if (data.success) {
      displayProductDetails(data.data);
    } else {
      productDetails.innerHTML = '<p>Product not found</p>';
    }
  } catch (error) {
    console.error('Error fetching product details:', error);
    productDetails.innerHTML = '<p>Error loading product details</p>';
  }
}

// Display Product Details
function displayProductDetails(product) {
  productDetails.innerHTML = `
    <div>
      <img src="${product.image}" alt="${product.name}">
    </div>
    <div class="product-details">
      <h1>${product.name}</h1>
      <p class="price">$${product.price.toFixed(2)}</p>
      <p>${product.description}</p>
      <p>Category: ${product.category}</p>
      <p>In Stock: ${product.countInStock}</p>
      <button onclick="addToCart('${product._id}', '${product.name}', ${product.price}, '${product.image}')">
        Add to Cart
      </button>
    </div>
  `;
}

// Add to Cart
function addToCart(id, name, price, image) {
  const existingItem = cart.find(item => item.id === id);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id, name, price, image, quantity: 1 });
  }
  
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert('Product added to cart!');
}

// Update Cart Count
function updateCartCount() {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  cartCount.textContent = count;
}

// Display Cart Items
function displayCartItems() {
  if (cart.length === 0) {
    cartItems.innerHTML = '<p>Your cart is empty</p>';
    updateCartSummary();
    return;
  }
  
  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-item-info">
        <h3>${item.name}</h3>
        <p class="price">$${item.price.toFixed(2)}</p>
      </div>
      <div class="cart-item-actions">
        <button onclick="updateQuantity('${item.id}', -1)">-</button>
        <input type="number" value="${item.quantity}" min="1" readonly>
        <button onclick="updateQuantity('${item.id}', 1)">+</button>
        <button onclick="removeFromCart('${item.id}')">Remove</button>
      </div>
    </div>
  `).join('');
  
  updateCartSummary();
}

// Update Quantity
function updateQuantity(id, change) {
  const item = cart.find(item => item.id === id);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(id);
    } else {
      localStorage.setItem('cart', JSON.stringify(cart));
      displayCartItems();
      updateCartCount();
    }
  }
}

// Remove from Cart
function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  localStorage.setItem('cart', JSON.stringify(cart));
  displayCartItems();
  updateCartCount();
}

// Update Cart Summary
function updateCartSummary() {
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shipping = subtotal > 0 ? 5.99 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;
  
  subtotalElement.textContent = subtotal.toFixed(2);
  taxElement.textContent = tax.toFixed(2);
  totalElement.textContent = total.toFixed(2);
}

// Handle Login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      // Fetch user data
      const userResponse = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.token}`
        }
      });
      
      const userData = await userResponse.json();
      if (userData.success) {
        localStorage.setItem('user', JSON.stringify(userData.data));
        currentUser = userData.data;
        loginModal.style.display = 'none';
        loginBtn.textContent = `Welcome, ${currentUser.name}`;
        alert('Login successful!');
      }
    } else {
      alert(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login');
  }
}

// Handle Checkout
async function handleCheckout() {
  if (!currentUser) {
    alert('Please login to checkout');
    loginModal.style.display = 'block';
    return;
  }
  
  if (cart.length === 0) {
    alert('Your cart is empty');
    return;
  }
  
  const orderItems = cart.map(item => ({
    product: item.id,
    name: item.name,
    quantity: item.quantity,
    price: item.price
  }));
  
  const shippingAddress = {
    address: '123 Main St',
    city: 'Anytown',
    postalCode: '12345',
    country: 'USA'
  };
  
  const paymentMethod = 'PayPal';
  
  const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  const shippingPrice = 5.99;
  const taxPrice = subtotal * 0.08;
  const totalPrice = subtotal + shippingPrice + taxPrice;
  
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        orderItems,
        shippingAddress,
        paymentMethod,
        itemsPrice: subtotal,
        taxPrice,
        shippingPrice,
        totalPrice
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Order placed successfully!');
      cart = [];
      localStorage.removeItem('cart');
      updateCartCount();
      window.location.href = 'index.html';
    } else {
      alert(data.message || 'Failed to place order');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    alert('An error occurred during checkout');
  }
}
