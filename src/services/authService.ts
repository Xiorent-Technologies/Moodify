import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  increment 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string, firstName: string, lastName: string, referralCode?: string) {
    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Send email verification
      await sendEmailVerification(user);

      // Create user document in Firestore with proper structure
      const userData = {
        email: email,
        firstName: firstName,
        lastName: lastName,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: false,
        subscriptionStatus: null, // New users start with no subscription
        trialUsed: false,
        trialEndDate: null, // No trial until they start one
        planType: null, // No plan until they choose one
        referralCode: await this.generateReferralCode(user.uid),
        referredBy: referralCode || null,
        totalReferrals: 0,
        referralEarnings: 0,
        isAdmin: false,
        isActive: true,
        // Spotify connection fields
        spotifyEmail: null,
        spotifyDisplayName: null,
        spotifyId: null,
        spotifyConnectedAt: null,
        lastSpotifySync: null
      };

      // This will work with production security rules
      await setDoc(doc(db, 'users', user.uid), userData);

      // Update referral document with user email
      await this.updateReferralWithEmail(userData.referralCode, email);

      // Process referral if provided (with proper error handling)
      if (referralCode) {
        try {
          await this.processReferral(referralCode, user.uid);
        } catch (error) {
          console.log('Referral processing failed:', error);
          // Don't fail signup if referral fails
        }
      }

      return { success: true, user: user };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update last login time (this will work with production rules)
      await updateDoc(doc(db, 'users', user.uid), {
        lastLoginAt: new Date()
      });

      return { success: true, user: user };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Send password reset email
  static async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get user data from Firestore (with production security)
  static async getUserData(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Generate unique referral code
  static async generateReferralCode(userId: string): Promise<string> {
    const prefix = 'MOODY';
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const referralCode = `${prefix}${randomSuffix}`;
      
      // Check if this code already exists in referrals collection
      const referralsRef = collection(db, 'referrals');
      const q = query(referralsRef, where('referralCode', '==', referralCode));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Code is unique, create the referral document
        await setDoc(doc(db, 'referrals', referralCode), {
          referralCode: referralCode,
          userId: userId,
          email: '', // Will be updated when user signs up
          createdAt: new Date(),
          totalUses: 0,
          isActive: true
        });
        return referralCode;
      }
      
      attempts++;
    }
    
    // Fallback: use timestamp if we can't generate unique code
    const timestamp = Date.now().toString(36).toUpperCase();
    const fallbackCode = `${prefix}${timestamp}`;
    
    await setDoc(doc(db, 'referrals', fallbackCode), {
      referralCode: fallbackCode,
      userId: userId,
      email: '',
      createdAt: new Date(),
      totalUses: 0,
      isActive: true
    });
    
    return fallbackCode;
  }

  // Update Spotify connection info
  static async updateSpotifyConnection(userId: string, spotifyData: {
    email: string;
    displayName: string;
    id: string;
  }) {
    try {
      await updateDoc(doc(db, 'users', userId), {
        spotifyEmail: spotifyData.email,
        spotifyDisplayName: spotifyData.displayName,
        spotifyId: spotifyData.id,
        spotifyConnectedAt: new Date(),
        lastSpotifySync: new Date()
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  // Get user's referral code
  static async getUserReferralCode(userId: string): Promise<string | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.referralCode || null;
      }
      return null;
    } catch (error: any) {
      console.error('Error getting referral code:', error);
      return null;
    }
  }

  // Update referral document with user email
  static async updateReferralWithEmail(referralCode: string, email: string) {
    try {
      await updateDoc(doc(db, 'referrals', referralCode), {
        email: email,
        updatedAt: new Date()
      });
      return { success: true };
    } catch (error: any) {
      console.error('Error updating referral with email:', error);
      return { success: false };
    }
  }

  // Process referral (production-ready with proper error handling)
  static async processReferral(referralCode: string, newUserId: string) {
    try {
      // Find user with this referral code
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', referralCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerId = referrerDoc.id;
        
        // Update referrer's total referrals
        await updateDoc(doc(db, 'users', referrerId), {
          totalReferrals: increment(1)
        });

        // Create referral record
        await setDoc(doc(db, 'referrals', `${referrerId}_${newUserId}`), {
          referrerId: referrerId,
          refereeId: newUserId,
          referralCode: referralCode,
          status: 'completed',
          rewardAmount: 7, // 7 extra days
          rewardType: 'free_trial_extension',
          createdAt: new Date(),
          completedAt: new Date()
        });

        // Extend trial for new user
        await updateDoc(doc(db, 'users', newUserId), {
          trialEndDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
        });
      }
    } catch (error) {
      console.error('Error processing referral:', error);
      throw error;
    }
  }
}
