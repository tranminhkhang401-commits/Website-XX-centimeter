(function () {
  var KEY = 'campuskit_cart';
  var COUPONS = { CAMPUS10: 10, SV15: 15 };   // >>> THAY mã giảm giá của nhóm
  var FREE_SHIP = 200000, SHIP = 15000;
  var coupon = { code: '', pct: 0 };
  var done = false;
  var $ = function (s) { return document.querySelector(s); };
  var fmt = function (n) { return Number(n).toLocaleString('vi-VN') + 'đ'; };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} updateCount(); }
  function updateCount() {
    var n = load().reduce(function (s, i) { return s + i.qty; }, 0);
    document.querySelectorAll('.cart-count').forEach(function (e) { e.textContent = n; });
  }
  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 1600);
  }

  // Định dạng giá
  document.querySelectorAll('.vnd').forEach(function (e) { e.textContent = fmt(e.textContent); });

  // Thêm vào giỏ
  document.addEventListener('click', function (e) {
    var b = e.target.closest('.add-to-cart');
    if (!b) return;
    var cart = load(), id = b.dataset.id;
    var item = cart.find(function (i) { return i.id === id; });
    if (item) item.qty++;
    else cart.push({ id: id, name: b.dataset.name, price: Number(b.dataset.price), image: b.dataset.image, qty: 1 });
    save(cart);
    toast('Đã thêm "' + b.dataset.name + '" vào giỏ');
  });

  // Tìm kiếm + lọc
  var search = $('#search'), cat = $('#category');
  if (search && cat) {
    var cards = document.querySelectorAll('#product-grid .card');
    var apply = function () {
      var q = search.value.trim().toLowerCase(), c = cat.value, shown = 0;
      cards.forEach(function (card) {
        var ok = card.dataset.name.indexOf(q) !== -1 && (!c || card.dataset.category === c);
        card.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      $('#no-result').hidden = shown > 0;
    };
    search.addEventListener('input', apply);
    cat.addEventListener('change', apply);
  }

  // Trang giỏ hàng
  var itemsBox = $('#cart-items');
  function totals(cart) {
    var sub = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    var disc = Math.round(sub * coupon.pct / 100);
    var ship = (sub === 0 || sub - disc >= FREE_SHIP) ? 0 : SHIP;
    return { sub: sub, disc: disc, ship: ship, total: sub - disc + ship };
  }
  function render() {
    if (!itemsBox || done) return;
    var cart = load();
    $('#cart-empty').hidden = cart.length > 0;
    $('#cart-wrap').hidden = cart.length === 0;
    itemsBox.innerHTML = cart.map(function (i) {
      return '<div class="row"><img src="' + i.image + '" alt="">' +
        '<div class="info"><strong>' + esc(i.name) + '</strong><span class="muted">' + fmt(i.price) + '</span></div>' +
        '<div class="qty"><button type="button" data-act="dec" data-id="' + i.id + '">−</button><span>' + i.qty +
        '</span><button type="button" data-act="inc" data-id="' + i.id + '">+</button></div>' +
        '<button type="button" class="del" data-act="del" data-id="' + i.id + '" aria-label="Xoá">✕</button></div>';
    }).join('');
    var t = totals(cart);
    $('#t-sub').textContent = fmt(t.sub);
    $('#t-disc').textContent = '-' + fmt(t.disc);
    $('#t-ship').textContent = t.ship ? fmt(t.ship) : 'Miễn phí';
    $('#t-total').textContent = fmt(t.total);
  }
  if (itemsBox) {
    itemsBox.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]');
      if (!b) return;
      var cart = load(), i = cart.find(function (x) { return x.id === b.dataset.id; });
      if (!i) return;
      if (b.dataset.act === 'inc') i.qty++;
      if (b.dataset.act === 'dec') i.qty = Math.max(1, i.qty - 1);
      if (b.dataset.act === 'del') cart = cart.filter(function (x) { return x !== i; });
      save(cart); render();
    });
    $('#apply-coupon').addEventListener('click', function () {
      var code = $('#coupon').value.trim().toUpperCase(), msg = $('#coupon-msg');
      if (COUPONS[code]) { coupon = { code: code, pct: COUPONS[code] }; msg.textContent = 'Đã áp dụng ' + code + ' (-' + coupon.pct + '%)'; }
      else { coupon = { code: '', pct: 0 }; msg.textContent = 'Mã không hợp lệ.'; }
      render();
    });
    $('#checkout-form').addEventListener('submit', function (e) {
      e.preventDefault();
      var cart = load();
      if (!cart.length) return;
      var f = e.target, t = totals(cart);
      var pay = f.querySelector('input[name=pay]:checked').value;
      var code = 'CK' + Math.floor(100000 + Math.random() * 900000);
      $('#order-success').innerHTML = '<h2>🎉 Đặt hàng thành công (mô phỏng)</h2>' +
        '<p>Mã đơn: <strong>' + code + '</strong></p><p>Thanh toán: ' + esc(pay) + '</p>' +
        '<ul>' + cart.map(function (i) { return '<li>' + esc(i.name) + ' × ' + i.qty + '</li>'; }).join('') + '</ul>' +
        '<p>Tổng cộng: <strong>' + fmt(t.total) + '</strong></p>' +
        '<p class="muted">Không có giao dịch thật nào được thực hiện và không có thông tin nào được lưu.</p>' +
        '<a class="btn" href="' + document.querySelector('.brand').href + '">Về trang chủ</a>';
      done = true;
      $('#cart-wrap').hidden = true; $('#cart-empty').hidden = true; $('#order-success').hidden = false;
      save([]); window.scrollTo(0, 0);
    });
  }
  updateCount(); render();
})();
