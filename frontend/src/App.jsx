import { useDispatch } from "react-redux";
import AppRoutes from "./routes";
import { useEffect } from "react";
import { getMe } from "./redux/slices/authSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (token) {
      dispatch(getMe());
    }

  }, []);
  return <AppRoutes />;
}

export default App;