import { createThirdwebClient } from 'thirdweb'
const id=process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID
export const thirdwebClient=id?createThirdwebClient({clientId:id}):null
