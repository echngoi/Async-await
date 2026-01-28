let mangdanhsachsp = [];
let manggiohang = [];
const bangsanpham = document.getElementById('productTable');

const filterInput = document.getElementById('filterInput');
const giaNhoNhatInput = document.getElementById('giaNhoNhatInput');
const giaLonNhatInput = document.getElementById('giaLonNhatInput');
const btnLoc = document.getElementById('filterBtnLoc');
const btnXoaBoLoc = document.getElementById('clearFilterBtn');

let trangthaiSua = null;

const nameInput = document.getElementById('nameInput');
const qtyInput = document.getElementById('qtyInput');
const priceInput = document.getElementById('priceInput');
const addBtn = document.getElementById('addBtn');

// Fetch sản phẩm từ API
async function fetchProducts() {
  const res = await fetch('http://localhost:3000/products');
  mangdanhsachsp = await res.json();
  hienThiSanPham();
}

// Fetch giỏ hàng từ API
async function fetchCart() {
  const res = await fetch('http://localhost:3000/cart');
  manggiohang = await res.json();
  hienThiGioHang();
  hienThiSanPham();
}

// Lưu giỏ hàng lên API (ghi đè toàn bộ)
async function saveCart() {
  // Xóa toàn bộ cart cũ
  const res = await fetch('http://localhost:3000/cart');
  const oldCart = await res.json();
  for (const item of oldCart) {
    await fetch(`http://localhost:3000/cart/${item.id}`, { method: 'DELETE' });
  }
  // Thêm lại từng item mới
  for (const item of manggiohang) {
    await fetch('http://localhost:3000/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
  }
}

// Thêm sản phẩm qua API
async function themSanPham() {
  const tensp = nameInput.value.trim();
  const soluong = parseInt(qtyInput.value, 10);
  const giatien = parseFloat(priceInput.value);
  if (!tensp) {
    alert('Vui lòng nhập tên sản phẩm');
    return;
  }
  if (trangthaiSua == null) {
    // Thêm mới
    await fetch('http://localhost:3000/products', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: tensp, price: giatien, stock: soluong }) // Dữ liệu sản phẩm mới
    });
    alert('Thêm sản phẩm thành công');
  } else {
    // Sửa
    const id = mangdanhsachsp[trangthaiSua].id; // Lấy id sản phẩm cần sửa
    await fetch(`http://localhost:3000/products/${id}` , {
      method: 'PUT',                                          // Sử dụng PUT để ghi đè toàn bộ dữ liệu
      headers: { 'Content-Type': 'application/json' },        // Định dạng dữ liệu gửi đi
      body: JSON.stringify({ name: tensp, price: giatien, stock: soluong }) // Ghi đè toàn bộ dữ liệu
    });
    trangthaiSua = null;
    addBtn.textContent = 'Thêm sản phẩm';
  }
  nameInput.value = '';
  qtyInput.value = '';
  priceInput.value = '';
  await fetchProducts(); // Cập nhật lại danh sách sản phẩm
}

// Xóa sản phẩm qua API
async function xoaSanPham(index) {
  if (index >= 0 && index < mangdanhsachsp.length) {
    const id = mangdanhsachsp[index].id; 
    await fetch(`http://localhost:3000/products/${id}`, { method: 'DELETE' }); 
    alert('Xóa sản phẩm thành công');
    await fetchProducts(); // Cập nhật lại danh sách sản phẩm
  }
}

// Sửa sản phẩm (điền dữ liệu vào form)
function suaSanPham(index) {
  const chinhSua = mangdanhsachsp[index];
  nameInput.value = chinhSua.name;
  qtyInput.value = chinhSua.stock;
  priceInput.value = chinhSua.price;
  addBtn.textContent = 'Cập nhật';
  trangthaiSua = index;
}

// Khi load trang, lấy sản phẩm và giỏ hàng từ API
fetchProducts();
fetchCart();

// hàm hiển thị sản phẩm
function hienThiSanPham(list = mangdanhsachsp) {
  bangsanpham.innerHTML = '';
  var rows = [];
  if (list === mangdanhsachsp) {
    for (var i = 0; i < mangdanhsachsp.length; i++) {
      rows.push({ sp: mangdanhsachsp[i], i: i });
    }
  } else {
    for (var j = 0; j < list.length; j++) {
      rows.push({ sp: list[j], i: mangdanhsachsp.indexOf(list[j]) });
    }
  }
  rows.forEach(({ sp, i }, displayIndex) => {
    // Sử dụng thuộc tính name, price, stock từ API
    const reserved = manggiohang.find(item => item.name === sp.name)?.quantity || 0;
    const available = Math.max(Number(sp.stock) - Number(reserved), 0);
    const availableTotal = available * Number(sp.price);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${displayIndex + 1}</td>
      <td>${sp.name}</td>
      <td>${sp.price}</td>
      <td>${available}</td>
      <td>${availableTotal}</td>
      <td>
        <button class="add-to-cart" ${available <= 0 ? 'disabled' : ''} onclick="themVaoGioHang(${i})">Thêm vào giỏ hàng</button>
        <button style="background-color: red; color: white;" onclick="xoaSanPham(${i})">Xóa</button>
        <button style="background-color: blue; color: white;" onclick="suaSanPham(${i})">Sửa</button>
      </td>
    `;
    bangsanpham.appendChild(row);
  });
}

// thêm sản phẩm bằng nút
addBtn.addEventListener('click', themSanPham);

// hàm lọc theo tên và khoảng giá
function applyFilter() {
  const name = (filterInput.value || '').trim().toLowerCase();
  const min = parseFloat(giaNhoNhatInput.value);
  const max = parseFloat(giaLonNhatInput.value);

  const filtered = mangdanhsachsp.filter(sp => {
    const matchName = !name || (sp.name || '').toLowerCase().includes(name);
    const price = Number(sp.price) || 0;
    const matchMin = isNaN(min) || price >= min;
    const matchMax = isNaN(max) || price <= max;
    return matchName && matchMin && matchMax;
  });

  hienThiSanPham(filtered);
}

// xóa bộ lọc và hiển thị đầy đủ
function clearFilter() {
  filterInput.value = '';
  giaNhoNhatInput.value = '';
  giaLonNhatInput.value = '';
  hienThiSanPham();
}

// gắn sự kiện cho nút Lọc và Xóa bộ lọc
btnLoc.addEventListener('click', applyFilter);
btnXoaBoLoc.addEventListener('click', clearFilter);

// tùy chọn: thêm sản phẩm khi nhấn Enter trong ô input
[nameInput, qtyInput, priceInput].forEach(el => {
  if (!el) return;
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      themSanPham();
    }
});
});

// tùy chọn: lọc khi nhấn Enter trong ô filter name / price
[filterInput, giaNhoNhatInput, giaLonNhatInput].forEach(el => {
  if (!el) return;
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyFilter();
    }
  });
});
// hàm hiển thị giỏ hàng
function hienThiGioHang() {
  const banggiohang = document.getElementById('giohang'); // lấy phần tử div giỏ hàng
  banggiohang.innerHTML = '';
  let totalOrder = 0;

  if (manggiohang.length === 0) {
    banggiohang.textContent = 'Giỏ hàng trống';
  } else {
    // tạo bảng giỏ hàng
    const table = document.createElement('table');
    table.border = '1';
    table.innerHTML = `
      <thead>
        <tr>
          <td>STT</td>
          <td>Tên</td>
          <td>Giá</td>
          <td>Số lượng</td>
          <td>Tổng</td>
          <td>Hành động</td>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector('tbody');// lấy phần tbody để thêm hàng

    manggiohang.forEach((item, index) => {
      const itemTotal = Number(item.quantity) * Number(item.price) || 0;
      totalOrder += itemTotal;

      const row = document.createElement('tr');// tạo hàng mới
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.name}</td>
        <td>${item.price}</td>
        <td>${item.quantity}</td>
        <td>${itemTotal}</td>
        <td><button style="background-color: red; color: white;" onclick="xoaKhoiGioHang(${index})">Xóa</button></td>
      `;
      tbody.appendChild(row);// thêm hàng vào tbody
    });

    banggiohang.appendChild(table);// thêm bảng vào div giỏ hàng
  }

  const tongDon = document.getElementById('tongdonhang');
  if (tongDon) {
    tongDon.textContent = `Tổng đơn hàng: ${totalOrder}`;
  }
}
// hàm xóa khỏi giỏ hàng — nhận index (vị trí mảng)
async function xoaKhoiGioHang(index) {
  if (index >= 0 && index < manggiohang.length) {
    const id = manggiohang[index].id;
    await fetch(`http://localhost:3000/cart/${id}`, { method: 'DELETE' });
    await fetchCart(); // Cập nhật lại giỏ hàng
  }
}

// thêm xử lý cho nút Xóa giỏ hàng và Thanh toán
const btnXoaGio = document.getElementById('xoagiohang');
const btnThanhToan = document.getElementById('thanhtoan');
if (btnXoaGio) {
  btnXoaGio.addEventListener('click', async () => { 
    // Xóa toàn bộ giỏ hàng trên server
    const res = await fetch('http://localhost:3000/cart'); // Lấy giỏ hàng hiện tại
    const cart = await res.json();                        // Chuyển đổi sang JSON
    for (const item of cart) {  // Xóa từng mục trong giỏ hàng
      await fetch(`http://localhost:3000/cart/${item.id}`, { method: 'DELETE' });
    }
    await fetchCart(); 
  });
}
if (btnThanhToan) {
  btnThanhToan.addEventListener('click', async () => {
    if (!manggiohang.length) {
      alert('Giỏ hàng trống');
      return;
    }
    // kiểm tra tồn kho trước khi trừ chính thức
    const insufficient = manggiohang.filter(item => {
      const sp = mangdanhsachsp.find(p => p.name === item.name);
      return !sp || Number(sp.stock) < Number(item.quantity);
    });
    if (insufficient.length) {
      const names = insufficient.map(i => i.name).join(', ');
      alert('Thanh toán thất bại. Sản phẩm không đủ kho: ' + names);
      return;
    }
    // trừ tồn kho chính thức trên server
    for (const item of manggiohang) {
      const sp = mangdanhsachsp.find(p => p.name === item.name);
      if (sp) {
        await fetch(`http://localhost:3000/products/${sp.id}`, {
          method: 'PATCH',                                        // Cập nhật một phần dữ liệu
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stock: Number(sp.stock) - Number(item.quantity) }) // Chỉ cập nhật trường stock
        });
      }
    }
    // Xóa giỏ hàng trên server
    const res = await fetch('http://localhost:3000/cart');  // Lấy giỏ hàng hiện tại
    const cart = await res.json(); // Chuyển đổi sang JSON
    for (const item of cart) {
      await fetch(`http://localhost:3000/cart/${item.id}`, { method: 'DELETE' });
    }
    const totalText = document.getElementById('tongdonhang').textContent; 
    alert('Thanh toán thành công — tổng: ' + totalText);
    await fetchCart();
  });
}

// hàm thêm vào giỏ hàng — nhận index (vị trí mảng)
async function themVaoGioHang(index) {
  const sp = mangdanhsachsp[index];
  if (!sp) return;
  const TimThayTrongGio = manggiohang.find(item => item.name === sp.name);
  const soluongtronggio = TimThayTrongGio ? Number(TimThayTrongGio.quantity) : 0;
  const available = Number(sp.stock) - soluongtronggio;
  if (available <= 0) {
    alert('Không đủ hàng trong kho');
    return;
  }
  if (TimThayTrongGio) {
    // Cập nhật số lượng trên server
    await fetch(`http://localhost:3000/cart/${TimThayTrongGio.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quantity: Number(TimThayTrongGio.quantity) + 1, 
        total: (Number(TimThayTrongGio.quantity) + 1) * Number(TimThayTrongGio.price)
      })
    });
  } else {
    // Thêm mới vào server
    await fetch('http://localhost:3000/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: sp.name,
        price: sp.price,
        quantity: 1,
        total: Number(sp.price)
      })
    });
  }
  await fetchCart();
}
