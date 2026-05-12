import { DomainError } from "../../../shared/errors/domain-error";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface IJwtService {
  sign(payload: JwtPayload): Promise<string>;
  verify(token: string): Promise<JwtPayload>;
}

export class JwtService implements IJwtService {
  constructor(private readonly secret: string) {}

  async sign(payload: JwtPayload): Promise<string> {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const body = btoa(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }));
    const signature = await this.hmacSign(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
  }

  async verify(token: string): Promise<JwtPayload> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new DomainError("Invalid token", 401);
    }

    const header = parts[0]!;
    const body = parts[1]!;
    const signature = parts[2]!;
    const expectedSig = await this.hmacSign(`${header}.${body}`);
    if (signature !== expectedSig) {
      throw new DomainError("Invalid token signature", 401);
    }

    try {
      return JSON.parse(atob(body)) as JwtPayload;
    } catch {
      throw new DomainError("Malformed token", 401);
    }
  }

  private async hmacSign(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(this.secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }
}
