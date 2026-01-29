// login.js
async function login(username, password) {
  const res = await fetch("http://localhost:3000/users");
  const users = await res.json(); 

  const user = users.find(
    u => u.username === username && u.password === password
  );

  if (!user) {
    throw new Error("Sai tài khoản hoặc mật khẩu");
  }

    localStorage.setItem("user", JSON.stringify(user)); 
    localStorage.setItem("token", user.token); 
    localStorage.setItem("username", user.username);
    localStorage.setItem("role", user.role);
    
}

// Sử dụng DOM để lấy phần tử
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    await login(username.value, password.value);
    alert("Đăng nhập thành công");
    window.location.href = "index.html";
  } catch (err) {
    alert(err.message);
  }
});

const token = localStorage.getItem("token");
if (token) {
  window.location.replace("index.html");
}
