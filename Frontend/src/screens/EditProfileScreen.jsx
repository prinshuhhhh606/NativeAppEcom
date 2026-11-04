import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './EditProfileScreen.styles';
import Header from '../components/Header';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { useAuth } from '../context/AuthContext';

export const EditProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, updateProfile, isAuthenticated } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Header title="Edit Profile" showBack navigation={navigation} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#1E293B' }}>
            Sign In Required
          </Text>
          <Text style={{ fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 20 }}>
            Please sign in to view and edit your profile information.
          </Text>
          <CustomButton
            title="Sign In / Register"
            size="large"
            onPress={() => navigation.navigate('Login', { redirectTo: 'EditProfile' })}
            style={{ width: 200 }}
          />
        </View>
      </View>
    );
  }

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        fullName,
        email,
        mobileNumber,
        gender,
      });
      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Edit Profile" showBack navigation={navigation} />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <Image
            source={{
              uri:
                user?.avatar ||
                'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80',
            }}
            style={styles.avatar}
          />
          <TouchableOpacity onPress={() => Alert.alert('Photo', 'Profile avatar is synced with your account.')}>
            <Text style={styles.changePhotoText}>Change Profile Picture</Text>
          </TouchableOpacity>
        </View>

        <CustomInput
          label="Full Name"
          required
          value={fullName}
          onChangeText={setFullName}
          leftIcon="person-outline"
        />

        <CustomInput
          label="Mobile Number"
          required
          editable={false}
          value={mobileNumber}
          leftIcon="call-outline"
          helperText="Verified registered Indian mobile number"
        />

        <CustomInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          leftIcon="mail-outline"
        />

        <Text style={styles.genderLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.genderBtn, gender === g && styles.genderBtnSelected]}
              onPress={() => setGender(g)}>
              <Text style={[styles.genderText, gender === g && styles.genderTextSelected]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <CustomButton
          title="Save Changes"
          size="large"
          loading={loading}
          onPress={handleSave}
          style={styles.saveBtn}
        />
      </ScrollView>
    </View>
  );
};

export default EditProfileScreen;

