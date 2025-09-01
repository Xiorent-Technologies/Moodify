# Moodify - Professional Expo React Native App

A modern, professional React Native application built with Expo, featuring a clean architecture and best practices.

## 🚀 Features

- **Modern Architecture**: Clean folder structure with separation of concerns
- **TypeScript**: Full TypeScript support for better development experience
- **Theme Support**: Light and dark mode support with automatic detection
- **Custom Components**: Reusable UI components with proper theming
- **Navigation**: Tab-based navigation using React Navigation
- **Performance**: Optimized with React Native Reanimated and proper image handling

## 📱 Platforms

- iOS
- Android
- Web

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State Management**: React Hooks
- **Styling**: React Native StyleSheet
- **Animations**: React Native Reanimated
- **Icons**: Expo Vector Icons

## 📁 Project Structure

```
moodify/
├── src/
│   ├── components/          # Reusable UI components
│   ├── constants/           # App constants and configurations
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── app/                    # App screens and navigation
├── assets/                 # Images, fonts, and other assets
├── App.tsx                 # Main app entry point
├── babel.config.js         # Babel configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd moodify
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on your preferred platform:
   - **iOS**: Press `i` in the terminal or run `npm run ios`
   - **Android**: Press `a` in the terminal or run `npm run android`
   - **Web**: Press `w` in the terminal or run `npm run web`

## 📝 Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator
- `npm run web` - Run on web browser
- `npm run lint` - Run ESLint for code quality
- `npm run reset-project` - Reset the project to a clean state

## 🎨 Customization

### Adding New Components

1. Create your component in `src/components/`
2. Export it from the components index file
3. Import and use it in your screens

### Adding New Screens

1. Create your screen in `app/` directory
2. Add it to the navigation in `app/_layout.tsx`
3. Update the tab navigation if needed

### Theming

The app supports light and dark themes. Colors are defined in `src/constants/Colors.ts` and automatically applied based on the user's system preference.

## 🔧 Configuration

### Babel Configuration

The project uses Babel with module resolver for clean import paths. You can configure aliases in `babel.config.js`.

### TypeScript Configuration

TypeScript is configured with strict mode enabled. Path mapping is set up for clean imports using the `@/` prefix.

## 📱 Building for Production

### Expo Build

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Build for web
expo build:web
```

### EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for all platforms
eas build --platform all
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Expo documentation](https://docs.expo.dev/)
2. Search existing issues
3. Create a new issue with detailed information

## 🙏 Acknowledgments

- Expo team for the amazing framework
- React Native community for the excellent ecosystem
- Contributors and maintainers

---

**Happy coding! 🎉**
