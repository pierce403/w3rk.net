import { createThirdwebClient } from "thirdweb";

const clientId = process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "test-client-id";

export const thirdwebClient = createThirdwebClient({
  clientId,
});
