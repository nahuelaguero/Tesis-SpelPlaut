import http from "k6/http";
import { check } from "k6";

// Login y obtener cookie auth-token
export function login(email, password, baseUrl) {
  const res = http.post(
    `${baseUrl}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );

  const loginOk = check(res, {
    "login status 200": (r) => r.status === 200,
    "login success": (r) => {
      try {
        return JSON.parse(r.body).success === true;
      } catch {
        return false;
      }
    },
  });

  if (!loginOk) {
    console.error(`Login fallido para ${email}: ${res.status} ${res.body}`);
    return null;
  }

  return res;
}

// Obtener headers con cookie de autenticacion
export function getAuthCookies(loginResponse) {
  if (!loginResponse || !loginResponse.cookies) return {};

  const cookies = {};
  const authToken = loginResponse.cookies["auth-token"];
  if (authToken && authToken.length > 0) {
    cookies["auth-token"] = authToken[0].value;
  }

  return cookies;
}
