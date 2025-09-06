# w3rk.net Farcaster Integration Guide

## 🟣 Overview

w3rk.net can be integrated with Farcaster as an official MiniApp, providing seamless access to decentralized tasking within the Farcaster ecosystem.

## 📱 Installation Methods

### Method 1: Official Farcaster MiniApp (Recommended)

**Prerequisites:**
- Farcaster account with developer mode enabled
- w3rk.net deployed with proper Farcaster manifest

**Setup Steps:**

1. **Enable Developer Mode:**
   - Go to [Farcaster Developer Tools](https://farcaster.xyz/~/settings/developer-tools)
   - Toggle on "Developer Mode"

2. **Generate Account Association:**
   - Use Farcaster Developer Tools to generate account association
   - This provides `header`, `payload`, and `signature` for your app

3. **Deploy with Farcaster Manifest:**
   - w3rk.net includes `/.well-known/farcaster.json` manifest
   - Contains app metadata and account association
   - Hosted at: `https://w3rk.net/.well-known/farcaster.json`

4. **Access in Farcaster:**
   - Share w3rk.net URL in Farcaster
   - MiniApp will load with native Farcaster integration
   - Access user's Farcaster identity and wallet

---

### Method 2: PWA Installation in Warpcast (Available Now)

**From Warpcast Mobile:**

1. **Cast or tap w3rk.net link** in Farcaster timeline
2. **Opens in Warpcast browser** with full PWA functionality
3. **Install to Home Screen:**
   - **iOS**: Share button → "Add to Home Screen"  
   - **Android**: Browser menu → "Add to home screen"
4. **Launch standalone** - Full native app experience

---

## 🔧 Technical Implementation

### Farcaster MiniApp SDK Integration

w3rk.net includes the official Farcaster MiniApp SDK:

```javascript
// FarcasterSDK component initializes on app load
import { sdk } from '@farcaster/miniapp-sdk'

// Signal readiness to Farcaster
await sdk.actions.ready()

// Access user's Farcaster identity
const user = await sdk.actions.getUser()
```

### Manifest Configuration

```json
{
  "frame": {
    "version": "1", 
    "name": "w3rk.net - Decentralized Tasking",
    "iconUrl": "https://w3rk.net/icon-192.png",
    "homeUrl": "https://w3rk.net",
    "buttonTitle": "Launch w3rk",
    "splashBackgroundColor": "#0052ff"
  }
}
```

### Frame Metadata Support

Job and service pages include frame metadata for rich previews:

```html
<meta property="fc:frame" content="vNext" />
<meta property="fc:frame:image" content="https://w3rk.net/api/og/job/[id]" />
<meta property="fc:frame:button:1" content="View Details" />
<meta property="fc:frame:button:2" content="Apply Now" />
```

---

## 🎯 User Experience

### In Farcaster Clients:

1. **Discovery:**
   - w3rk.net links shared as rich previews/frames
   - Native MiniApp integration (when setup complete)
   - Social discovery through Farcaster network

2. **Authentication:**
   - Connect existing Farcaster identity
   - Link Farcaster profile to w3rk account
   - Use Farcaster-connected wallets

3. **Social Integration:**  
   - Share job completions to Farcaster timeline
   - Build reputation through Farcaster social graph
   - Discover jobs from Farcaster connections

---

## 🚀 Current Status

### ✅ Ready Now:
- PWA works perfectly in Warpcast browser
- Home screen installation from Farcaster
- Farcaster SDK integration implemented
- Manifest file prepared for MiniApp registration

### 🔄 Setup Required:
- Generate account association in Farcaster Developer Tools
- Add account association to manifest file
- Submit for official MiniApp registration (if desired)

### 🎯 Future Enhancements:
- Native Farcaster login integration
- Automatic job sharing to timeline
- Farcaster reputation integration
- Community channels and social features

---

## 📋 Quick Start for Users

### Install w3rk.net in Farcaster Right Now:

1. **Cast this link** or find it in your timeline:
   ```
   🔵 Check out w3rk.net - decentralized jobs on Base! 
   https://w3rk.net 💼⚡
   ```

2. **Tap the link** → Opens in Warpcast browser

3. **Add to Home Screen** → Full native app experience  

4. **Connect wallet** → Start earning and posting jobs

5. **Link Farcaster profile** → Build social reputation

**🟣 w3rk.net is ready for the Farcaster ecosystem - install and start tasking!**

---

## 🔍 Developer Setup (Complete MiniApp)

If you want to complete the full Farcaster MiniApp setup:

1. **Enable Developer Mode** in your Farcaster account
2. **Generate account association** using Farcaster tools  
3. **Update manifest** with your association credentials
4. **Redeploy** w3rk.net with updated manifest
5. **Test** MiniApp functionality in Farcaster clients

The foundation is ready - just need the account association step!