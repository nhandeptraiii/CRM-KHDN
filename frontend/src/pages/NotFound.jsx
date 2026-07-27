import { Link } from "react-router-dom";
import logo from "../assets/images/logo.png";
import "./NotFound.scss";

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-brand">
        <img src={logo} alt="Viettel" />
      </div>

      <div className="not-found-content">
        <div className="code">404</div>
        <div className="title">Not Found</div>
        <div className="divider" />
        <div className="desc">
          The resource requested could not be found on this server!
        </div>
        <Link to="/" className="not-found-home-link">
          Quay ve trang chu
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
