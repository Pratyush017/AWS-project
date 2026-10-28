export const COGNITO_CONFIG = {
  region: process.env.NEXT_PUBLIC_COGNITO_REGION || "ap-south-1",
  userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "ap-south-1_QOD15h5ZS",
  clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "5367n3jeafigqt9k3u2ifc01jd",
  domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN || "civicguard-auth-8958.auth.ap-south-1.amazoncognito.com",
};

/**
 * Builds the direct Google Sign-In authorization URL via AWS Cognito
 */
export function getCognitoGoogleLoginUrl(redirectUri: string): string {
  const params = new URLSearchParams({
    identity_provider: "Google",
    redirect_uri: redirectUri,
    response_type: "code",
    client_id: COGNITO_CONFIG.clientId,
    scope: "email openid profile",
  });
  return `https://${COGNITO_CONFIG.domain}/oauth2/authorize?${params.toString()}`;
}

/**
 * Builds the Cognito logout URL
 */
export function getCognitoLogoutUrl(logoutUri: string): string {
  const params = new URLSearchParams({
    client_id: COGNITO_CONFIG.clientId,
    logout_uri: logoutUri,
  });
  return `https://${COGNITO_CONFIG.domain}/logout?${params.toString()}`;
}

export interface CognitoTokens {
  id_token: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface CognitoUser {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

/**
 * Decodes a JWT payload without external heavy crypto libraries
 */
export function parseJwtPayload(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}
