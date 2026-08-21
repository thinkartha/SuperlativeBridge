import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  SignUpCommand,
  type InitiateAuthCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";

export const isCognitoAuthMode =
  (import.meta.env.VITE_AUTH_MODE as string | undefined) === "cognito";

const region =
  (import.meta.env.VITE_COGNITO_REGION as string | undefined) || "us-east-1";
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string | undefined;
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID as string | undefined;

function requireConfig() {
  if (!userPoolId || !clientId) {
    throw new Error(
      "Cognito is not configured. Missing VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_CLIENT_ID."
    );
  }
}

function getClient() {
  requireConfig();
  return new CognitoIdentityProviderClient({ region });
}

function mapCognitoError(err: unknown): Error {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name: string }).name)
      : "";
  const message =
    err && typeof err === "object" && "message" in err
      ? String((err as { message: string }).message)
      : "Authentication failed";

  switch (name) {
    case "NotAuthorizedException":
      return new Error("Invalid email or password.");
    case "UserNotConfirmedException":
      return new Error("Please confirm your email before signing in.");
    case "UserNotFoundException":
      return new Error("No account found for that email.");
    case "InvalidPasswordException":
      return new Error(
        "Password must be at least 12 characters and include upper, lower, number, and symbol."
      );
    case "UsernameExistsException":
      return new Error("An account with this email already exists.");
    case "CodeMismatchException":
      return new Error("Invalid verification code.");
    default:
      return new Error(message);
  }
}

export async function cognitoSignIn(
  email: string,
  password: string
): Promise<string> {
  try {
    const out: InitiateAuthCommandOutput = await getClient().send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );
    const token = out.AuthenticationResult?.IdToken;
    if (!token) {
      throw new Error("Cognito did not return an ID token.");
    }
    return token;
  } catch (err) {
    throw mapCognitoError(err);
  }
}

export async function cognitoSignUp(input: {
  email: string;
  password: string;
  name: string;
  role: string;
}): Promise<void> {
  try {
    await getClient().send(
      new SignUpCommand({
        ClientId: clientId,
        Username: input.email,
        Password: input.password,
        UserAttributes: [
          { Name: "email", Value: input.email },
          { Name: "name", Value: input.name },
          { Name: "custom:role", Value: input.role },
        ],
      })
    );
  } catch (err) {
    throw mapCognitoError(err);
  }
}

export async function cognitoConfirmSignUp(
  email: string,
  code: string
): Promise<void> {
  try {
    await getClient().send(
      new ConfirmSignUpCommand({
        ClientId: clientId,
        Username: email,
        ConfirmationCode: code,
      })
    );
  } catch (err) {
    throw mapCognitoError(err);
  }
}
