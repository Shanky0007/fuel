import { Platform } from "react-native";
import Constants from "expo-constants";

const PRODUCTION_API_URL =
  "https://2dc0-2401-4900-892e-5a3-5cf8-ec30-49ec-dcd0.ngrok-free.app/api";

const getBaseUrl = () => {
  if (Platform.OS === "web") {
    return PRODUCTION_API_URL;
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(":")[0];
    return `http://${ip}:5000/api`;
  }

  return PRODUCTION_API_URL;
};

export const API_URL = getBaseUrl();
export const BASE_URL = getBaseUrl();

console.log("API URL:", API_URL);
