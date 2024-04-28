import { Route, Routes } from "react-router-dom";
import AppContainer from "./components/AppContainer";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AppContainer />}>
        <Route index element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="/login" element={<Login />}></Route>
      <Route path="/register" element={<Register />}></Route>
      <Route path="/email/verify/:code" element={<VerifyEmail />}></Route>
      <Route path="/password/forgot" element={<ForgotPassword />}></Route>
      <Route path="/password/reset" element={<ResetPassword />}></Route>
    </Routes>
  );
}

export default App;
