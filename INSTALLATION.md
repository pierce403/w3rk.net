# w3rk.net MiniApp Installation Guide

## 🔵 Overview

w3rk.net is now available as a Progressive Web App (PWA) miniapp that provides a native-like experience on mobile devices, especially optimized for Base App integration.

## 📱 Installation Methods

### Method 1: Install via Base App (Recommended)

**For Base App Users:**

1. **Open Base App** on your mobile device
2. **Navigate to w3rk.net** using the in-app browser
3. **Connect your wallet** using the "Continue with Base (Coinbase)" button
4. **Add to Home Screen:**
   - **iOS**: Tap the share button (⬆️) → "Add to Home Screen" → "Add"
   - **Android**: Tap browser menu (⋯) → "Add to Home screen" → "Add"

**Result:** w3rk.net will appear as a standalone app icon on your device with full Base wallet integration.

---

### Method 2: Direct Browser Installation

**Chrome/Edge (Android/Desktop):**

1. Open Chrome/Edge and navigate to **https://w3rk.net**
2. Look for the **"Install"** button in the address bar (or banner)
3. Click **"Install"** → Confirm installation
4. The app will be added to your device/desktop

**Safari (iOS):**

1. Open Safari and navigate to **https://w3rk.net**
2. Tap the **Share button** (⬆️) at the bottom
3. Scroll down and tap **"Add to Home Screen"**
4. Customize the name if desired → Tap **"Add"**

**Firefox (Mobile):**

1. Navigate to **https://w3rk.net**
2. Tap the **menu button** (⋯) → **"Install"**
3. Confirm installation

---

### Method 3: QR Code Installation

Scan this QR code with your mobile camera:

```
█████████████████████████████████
█████████████████████████████████
████ ▄▄▄▄▄ █▀█ █▄▀▄▀█ ▄▄▄▄▄ ████
████ █   █ █▀▀▀█ ▀▄▀█▀ █   █ ████
████ █▄▄▄█ █▀ █▀ ▄█▄  █▄▄▄█ ████
████▄▄▄▄▄▄▄█▄▀ ▀▄▀ █ █▄▄▄▄▄▄████
████▄▄  ▄▀▄   ▀▀▀ ▄▄▀▄▄  █▀█████
████▀▄ █▄▄▄▄▀██▀██ ▀▄▄█▀▀▀▄▄████
████▄▄██▄▄▄█▀▀ █▀▀█▄ ▄▀▀█▄▀█████
████ ▄▄▄▄▄ █▄  ▄▀▄  █▀█ ▀▄ █████
████ █   █ █▄▀██▀▄▄▄▄▀▄▄▄▄▄▀████
████ █▄▄▄█ █▄▄ █▄█▀▀▄█ ▀▄▀█▄████
████▄▄▄▄▄▄▄█▄▄▄▄███▄▄▄█▄█▄██████
█████████████████████████████████
█████████████████████████████████
```

Or manually enter: **https://w3rk.net**

---

## 🚀 First Launch Setup

### Step 1: Connect Your Wallet

1. **Launch the w3rk miniapp** from your home screen
2. **Tap "Continue with Base (Coinbase)"** on the homepage
3. **Choose your wallet type:**
   - **Smart Wallet**: New users get an embedded wallet with passkey auth
   - **Coinbase Wallet**: Connect your existing Coinbase Wallet
   - **Base App**: Seamless integration if launched from Base App

### Step 2: Profile Setup

1. **Your ENS/Base name** will be automatically resolved and displayed
2. **Complete your profile** by navigating to Profile → "Set up your profile name"
3. **Add skills** relevant to your expertise
4. **Set up notifications** (optional)

### Step 3: Start Using w3rk

- **Browse Jobs**: Tap the Jobs tab to find work opportunities
- **Browse Services**: Tap Services to find service providers  
- **Post Work**: Use the + (Post) button to create jobs or services
- **Earn & Pay**: All transactions happen on Base network with low fees

---

## 🔧 Technical Requirements

### Minimum Requirements

- **Mobile OS**: iOS 11.3+ / Android 8.0+
- **Browsers**: Chrome 67+, Safari 11.1+, Firefox 58+, Edge 79+
- **Storage**: ~10MB for app cache
- **Network**: Internet connection required (offline browsing supported)

### Optimal Experience

- **Device**: Smartphone with biometric authentication
- **Network**: Base network wallet (Coinbase Wallet, Base App)
- **Connection**: 3G or better internet connection
- **Permissions**: Camera (for QR codes), Notifications (for updates)

---

## 🎯 Features in MiniApp Mode

### ✅ Native App Experience
- **Standalone mode**: Runs without browser UI
- **Full-screen**: Immersive experience
- **App icon**: Dedicated icon on home screen
- **Splash screen**: w3rk branding during launch

### ✅ Mobile-Optimized UI  
- **Bottom navigation**: Easy thumb navigation
- **Swipe gestures**: Natural mobile interactions
- **Touch-optimized**: Proper touch targets and spacing
- **Responsive design**: Adapts to all screen sizes

### ✅ Offline Capabilities
- **Cached content**: Browse previously loaded jobs/services
- **Background sync**: Updates when connection restored  
- **Service worker**: Fast loading and offline functionality
- **Local storage**: Persistent app state

### ✅ Base Network Integration
- **Smart Wallet**: Embedded wallet with passkey auth
- **Low fees**: Base network gas optimization
- **Fast transactions**: L2 scaling benefits
- **Coinbase integration**: Seamless Base App experience

---

## 🔍 Troubleshooting

### Installation Issues

**"Install" button not appearing:**
- Ensure you're using a supported browser
- Check if PWA is already installed
- Clear browser cache and try again

**Installation fails:**
- Check available storage space (need ~10MB)
- Disable browser extensions temporarily  
- Try incognito/private browsing mode

### Wallet Connection Issues

**Smart Wallet not creating:**
- Ensure biometric authentication is enabled
- Check Base network is selected
- Verify `NEXT_PUBLIC_PRIVY_APP_ID` is configured

**Base App not connecting:**
- Update Base App to latest version
- Clear Base App cache in settings
- Try connecting via QR code method

### Performance Issues

**App loading slowly:**
- Check internet connection
- Clear app cache: Settings → Storage → w3rk.net → Clear Data
- Reinstall the miniapp

**UI elements not responsive:**
- Close and reopen the app
- Check if device has sufficient RAM
- Update your browser to latest version

---

## 🔒 Security & Privacy

### Data Protection
- **Local storage**: User data stored locally on device
- **HTTPS only**: All communications encrypted
- **No tracking**: Privacy-first approach (no Google Analytics)
- **Wallet security**: Private keys never leave your device

### Permissions
- **Camera**: For QR code scanning (optional)
- **Notifications**: For job/service updates (optional)  
- **Storage**: For offline functionality and caching
- **Network**: For blockchain transactions and data sync

---

## 🆘 Support

### Getting Help

**Documentation:**
- Main README: `/README.md`
- Technical docs: Browse the `/docs` folder
- API reference: Visit `/api` endpoints

**Community Support:**
- GitHub Issues: Report bugs and feature requests
- Discord: Join the w3rk.net community (link in app)
- Twitter: Follow @w3rk_net for updates

**Technical Support:**
- Email: support@w3rk.net
- Response time: 24-48 hours
- Include device info and error messages

---

## 🔄 Updates

### Auto-Updates
- **Automatic**: App updates automatically when online
- **Background**: Updates download in background
- **Restart prompt**: User prompted to restart for major updates
- **Version check**: Manual check in Settings → About

### Manual Updates
1. **Close the miniapp** completely
2. **Open your browser** (Chrome/Safari/etc.)
3. **Visit https://w3rk.net** to trigger update
4. **Restart the miniapp** from home screen

---

## 🎉 Success Checklist

After installation, verify these work:

- [ ] **App launches** from home screen icon
- [ ] **Wallet connects** successfully  
- [ ] **ENS name displays** correctly
- [ ] **Bottom navigation** works on mobile
- [ ] **Jobs/Services load** properly
- [ ] **Posting works** with wallet signature
- [ ] **Profile page** shows your info
- [ ] **Offline browsing** functions (airplane mode test)

**🔥 You're ready to earn on w3rk.net!**

---

*For developers: See `/README.md` for development setup and deployment instructions.*
