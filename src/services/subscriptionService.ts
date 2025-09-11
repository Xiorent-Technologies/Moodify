import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export class SubscriptionService {
  // Get user subscription status (production-ready)
  static async getSubscriptionStatus(userId: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          status: userData.subscriptionStatus || null, // Return null if no subscription
          trialUsed: userData.trialUsed || false,
          trialEndDate: userData.trialEndDate?.toDate() || null,
          planType: userData.planType || null
        };
      }
      return null;
    } catch (error: any) {
      console.error('Error getting subscription status:', error);
      throw new Error('Failed to get subscription status');
    }
  }

  // Start free trial (production-ready)
  static async startFreeTrial(userId: string, planType: 'monthly' | 'yearly') {
    try {
      const trialEndDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
      
      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document first
        await setDoc(userDocRef, {
          subscriptionStatus: 'trial',
          trialUsed: true,
          trialEndDate: trialEndDate,
          planType: planType,
          createdAt: new Date()
        });
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          subscriptionStatus: 'trial',
          trialUsed: true,
          trialEndDate: trialEndDate,
          planType: planType
        });
      }

      // Create subscription record
      await addDoc(collection(db, 'subscriptions'), {
        userId: userId,
        planType: planType,
        status: 'trial',
        trialStartDate: new Date(),
        trialEndDate: trialEndDate,
        amount: 0,
        currency: 'USD',
        createdAt: new Date()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error starting free trial:', error);
      throw new Error('Failed to start free trial');
    }
  }

  // Subscribe to plan (production-ready)
  static async subscribeToPlan(userId: string, planType: 'monthly' | 'yearly') {
    try {
      const subscriptionEndDate = new Date();
      if (planType === 'monthly') {
        subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
      } else {
        subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
      }

      // Check if user document exists, if not create it
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document first
        await setDoc(userDocRef, {
          subscriptionStatus: 'active',
          planType: planType,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: subscriptionEndDate,
          createdAt: new Date()
        });
      } else {
        // Update existing user document
        await updateDoc(userDocRef, {
          subscriptionStatus: 'active',
          planType: planType,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: subscriptionEndDate
        });
      }

      // Create subscription record
      await addDoc(collection(db, 'subscriptions'), {
        userId: userId,
        planType: planType,
        status: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: subscriptionEndDate,
        amount: planType === 'monthly' ? 9.99 : 99.99,
        currency: 'USD',
        createdAt: new Date()
      });

      return { success: true };
    } catch (error: any) {
      console.error('Error subscribing to plan:', error);
      throw new Error('Failed to subscribe to plan');
    }
  }

  // Check if user has active subscription (production-ready)
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const subscription = await this.getSubscriptionStatus(userId);
      if (!subscription) return false;

      const now = new Date();
      const trialEnd = subscription.trialEndDate;

      if (subscription.status === 'active') {
        return true;
      }

      if (subscription.status === 'trial' && trialEnd && trialEnd > now) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }
}
