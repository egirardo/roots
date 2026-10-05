import { FeedToggle } from "@/components/ui/profilePage/feedToggle";
import { Colors } from "@/constants/design-system";
import { getUserPlants } from "@/services/plantService";
import { getUserProfile } from "@/services/userService";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, RefreshControl } from "react-native";
import { ProfileCard } from "../../components/ui/profilePage/profileCard";
import { ProfileFeed } from "../../components/ui/profilePage/profileFeed";
import { useAuth } from "../../contexts/AuthContext";
import { Plant, UserProfile } from "../../interfaces/index";
import TabLayout from "./_layout";


export default function ProfileScreen() {
  const router = useRouter();
  const [showAll, setShowAll] = useState(true);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<Partial<UserProfile> | null>(
    null
  );
  const [plants, setPlants] = useState<Plant[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlants = useCallback(async () => {
    if (!user?.uid) return;
    const userPlants = await getUserPlants(user.uid);
    setPlants(userPlants);
  }, [user?.uid]);

  const fetchProfile = useCallback(async () => {
    if (!user?.uid) return;
    const profile = await getUserProfile(user.uid);
    if (profile) {
      setUserProfile(profile);
    }
  }, [user?.uid]);

  useEffect(() => {
    if (user?.uid) {
      fetchPlants();
    }
  }, [user?.uid, fetchPlants]);

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        fetchProfile();
      }
    }, [user?.uid, fetchProfile])
  );

  const displayedPlants = showAll
    ? plants
    : plants.filter((plant) => plant.readyToAdopt);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchPlants()]); // Kör båda samtidigt
    setRefreshing(false);
  };

  
  return (
    <>
      <ScrollView style={styles.page}
      refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[Colors.accent]} 
                tintColor={Colors.accent}
              />
            }>
        <ProfileCard userProfile={userProfile} />
        <FeedToggle showAll={showAll} onToggle={setShowAll} />
        <TabLayout />
        <ProfileFeed
          plants={displayedPlants}
          userId={user?.uid!}
          onPlantPress={(plantId) => router.push(`/view-plant/${plantId}`)}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: Colors.secondary,
    
  },
});
