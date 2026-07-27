import { useState } from "react";
import { useDispatch } from "react-redux";
import { login, getMe } from "../../redux/slices/authSlice";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import logo from "../../assets/images/logo.png";
import "./Login.scss";

function Login() {

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: ""
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.username.trim()) {
      toast.warning("Vui lòng nhập email");
      return;
    }

    if (!form.password.trim()) {
      toast.warning("Vui lòng nhập mật khẩu");
      return;
    }

    try {
      await dispatch(login(form)).unwrap();

      await dispatch(getMe());

      toast.success("Đăng nhập thành công");

      // delay chuyển trang để toast hiển thị
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      const message =
        err?.message || "Email hoặc mật khẩu không chính xác";

      toast.error(message);
    }
  };

  return (
    <div className="login-page">

      <div className="login-card">

        <div className="login-logo">
          <img src={logo} alt="logo" />
        </div>

        <h2>HỆ THỐNG QUẢN LÝ <br /> TIẾP XÚC DOANH NGHIỆP</h2>
        <p className="login-subtitle">Đăng nhập để tiếp tục</p>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Email"
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="login-btn">
            Đăng nhập
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;