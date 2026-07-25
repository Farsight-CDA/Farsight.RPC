/**
 * Helpers for the FIDO2 / WebAuthn ceremonies used by the auth endpoints.
 * The API exchanges binary fields as base64url (RFC 4648, no padding) strings,
 * while the browser's WebAuthn API works with ArrayBuffers.
 */

export interface PublicKeyCredentialDescriptorJson {
  type: "public-key";
  id: string;
  transports?: string[];
}

/** JSON shape of Fido2NetLib's AssertionOptions (login ceremony). */
export interface AssertionOptionsJson {
  challenge: string;
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJson[];
  userVerification?: UserVerificationRequirement;
  hints?: string[];
  extensions?: Record<string, unknown>;
}

/** JSON shape of Fido2NetLib's CredentialCreateOptions (registration ceremony). */
export interface CredentialCreateOptionsJson {
  rp: { id?: string; name: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: { type: "public-key"; alg: number }[];
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment;
    residentKey?: ResidentKeyRequirement;
    requireResidentKey?: boolean;
    userVerification?: UserVerificationRequirement;
  };
  hints?: string[];
  excludeCredentials?: PublicKeyCredentialDescriptorJson[];
  extensions?: Record<string, unknown>;
}

/** JSON shape of Fido2NetLib's AuthenticatorAssertionRawResponse. */
export interface SerializedAssertion {
  id: string;
  rawId: string;
  type: string;
  response: {
    authenticatorData: string;
    signature: string;
    clientDataJSON: string;
    userHandle?: string;
  };
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

/** JSON shape of Fido2NetLib's AuthenticatorAttestationRawResponse. */
export interface SerializedAttestation {
  id: string;
  rawId: string;
  type: string;
  response: {
    attestationObject: string;
    clientDataJSON: string;
    transports: string[];
  };
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.PublicKeyCredential !== "undefined" &&
    typeof navigator.credentials?.get === "function" &&
    typeof navigator.credentials?.create === "function"
  );
}

export function base64UrlToArrayBuffer(base64Url: string): ArrayBuffer {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function toRequestOptions(
  options: AssertionOptionsJson,
): PublicKeyCredentialRequestOptions {
  return {
    challenge: base64UrlToArrayBuffer(options.challenge),
    timeout: options.timeout,
    rpId: options.rpId,
    allowCredentials: options.allowCredentials?.map((descriptor) => ({
      type: "public-key",
      id: base64UrlToArrayBuffer(descriptor.id),
      transports: descriptor.transports as AuthenticatorTransport[] | undefined,
    })),
    userVerification: options.userVerification,
    extensions: options.extensions as
      | AuthenticationExtensionsClientInputs
      | undefined,
    // `hints` is not yet part of the TypeScript DOM types.
    ...(options.hints ? { hints: options.hints } : {}),
  } as PublicKeyCredentialRequestOptions;
}

export function toCreationOptions(
  options: CredentialCreateOptionsJson,
): PublicKeyCredentialCreationOptions {
  return {
    rp: options.rp,
    user: {
      name: options.user.name,
      displayName: options.user.displayName,
      id: base64UrlToArrayBuffer(options.user.id),
    },
    challenge: base64UrlToArrayBuffer(options.challenge),
    pubKeyCredParams: options.pubKeyCredParams,
    timeout: options.timeout,
    attestation: options.attestation,
    authenticatorSelection: options.authenticatorSelection,
    excludeCredentials: options.excludeCredentials?.map((descriptor) => ({
      type: "public-key",
      id: base64UrlToArrayBuffer(descriptor.id),
      transports: descriptor.transports as AuthenticatorTransport[] | undefined,
    })),
    extensions: options.extensions as
      | AuthenticationExtensionsClientInputs
      | undefined,
    // `hints` is not yet part of the TypeScript DOM types.
    ...(options.hints ? { hints: options.hints } : {}),
  } as PublicKeyCredentialCreationOptions;
}

export function serializeAssertion(
  credential: PublicKeyCredential,
): SerializedAssertion {
  const response = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      ...(response.userHandle
        ? { userHandle: arrayBufferToBase64Url(response.userHandle) }
        : {}),
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

export function serializeAttestation(
  credential: PublicKeyCredential,
): SerializedAttestation {
  const response = credential.response as AuthenticatorAttestationResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      transports:
        typeof response.getTransports === "function"
          ? response.getTransports()
          : [],
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

/** Maps WebAuthn DOMExceptions to user-facing messages. */
export function webAuthnErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case "NotAllowedError":
        return "The security key prompt was cancelled or timed out.";
      case "NotSupportedError":
        return "This security key is not supported.";
      case "InvalidStateError":
        return "This security key is already registered.";
      case "SecurityError":
        return "The security key ceremony is not allowed on this origin.";
    }
  }
  return error instanceof Error ? error.message : fallback;
}
