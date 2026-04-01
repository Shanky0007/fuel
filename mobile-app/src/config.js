import { Platform } from "react-native";
import Constants from "expo-constants";

const PRODUCTION_API_URL = "https://fuel-backend-175700686095.asia-south1.run.app/api";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return "http://localhost:5000/api";
  }

  // In development, use the local machine's IP via Expo
  const debuggerHost =
    Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;

  if (__DEV__ && debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:5000/api`;
  }

  // Production - use GCP VM
  return PRODUCTION_API_URL;
};

export const API_URL = getBaseUrl();
export const BASE_URL = getBaseUrl();

console.log("API URL:", API_URL);
