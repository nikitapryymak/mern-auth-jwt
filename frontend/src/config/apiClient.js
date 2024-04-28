import axios from "axios";
import queryClient from "./queryClient";
import { AUTH } from "../hooks/useAuth";
import { UNAUTHORIZED } from "../constants/http.mjs";

const options = {
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
};

// create a separate client for refreshing the access token
// to avoid infinite loops with the error interceptor
const TokenRefreshClient = axios.create(options);
TokenRefreshClient.interceptors.response.use((response) => response.data);

const API = axios.create(options);

API.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error;
    const { status, data } = response || {};

    // try to refresh the access token behind the scenes
    if (status === UNAUTHORIZED && data?.errorCode === "InvalidAccessToken") {
      try {
        // refresh the access token, then retry the original request
        await TokenRefreshClient.get("/auth/refresh");
        return TokenRefreshClient(config);
      } catch (error) {
        // handle refresh errors
        // this will re-render the app container and redirect to login
        queryClient.setQueryData([AUTH], null);
      }
    }

    return Promise.reject({ status, ...data });
  }
);

export default API;
