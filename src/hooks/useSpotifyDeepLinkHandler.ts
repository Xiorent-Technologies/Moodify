import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { useEffect } from "react";

export function useSpotifyDeepLinkHandler() {
  useEffect(() => {
    console.log("🚀 Spotify Deep Link Handler initialized!");
    
    const sub = Linking.addEventListener("url", async ({ url }) => {
      console.log("🔗 Deep link received:", url);

      const { queryParams } = Linking.parse(url);
      if (queryParams?.code) {
        console.log("✅ Auth code detected:", queryParams.code);

        await AsyncStorage.setItem("spotifyAuthCode", queryParams.code as string);
        if (queryParams.state) {
          await AsyncStorage.setItem("spotifyAuthState", queryParams.state as string);
        }
      }
    });

    // Handle case where app was cold-started by a deep link
    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) {
        console.log("🔗 Initial deep link:", initial);
        const { queryParams } = Linking.parse(initial);
        if (queryParams?.code) {
          await AsyncStorage.setItem("spotifyAuthCode", queryParams.code as string);
          if (queryParams.state) {
            await AsyncStorage.setItem("spotifyAuthState", queryParams.state as string);
          }
        }
      }
    })();

    return () => sub.remove();
  }, []);
}
